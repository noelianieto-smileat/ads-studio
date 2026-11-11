-- Flujo de aprobación. Ejecutar DESPUÉS de schema.sql (SQL Editor → Run).
-- Roles: admin, design (Diseño), marketing (revisor de Marketing), user.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','design','marketing','user'));
create or replace function public.my_role() returns text language sql stable security definer as $$
  select role from public.profiles where id=auth.uid() $$;

-- Ajuste: ¿las piezas sensibles necesitan también aprobación de Marketing?
create table if not exists public.app_settings(key text primary key, value text not null);
insert into public.app_settings values('dual_approval_sensitive','true') on conflict do nothing;
alter table public.app_settings enable row level security;
create policy "leer ajustes" on public.app_settings for select using (public.is_smileat());
create policy "admin ajustes" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
-- Para exigir solo Diseño: update public.app_settings set value='false' where key='dual_approval_sensitive';

alter table public.creatives
  add column if not exists approval_status text not null default 'draft' check (approval_status in ('draft','pending_design','changes_requested','approved')),
  add column if not exists needs_marketing boolean not null default false,
  add column if not exists approved_version int,
  add column if not exists final_path text;

create table if not exists public.approvals(
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.creatives on delete cascade,
  version int not null, stage text not null check (stage in ('design','marketing')),
  decision text not null check (decision in ('approved','changes_requested')), comment text,
  decided_by uuid not null default auth.uid(), decided_at timestamptz default now());
alter table public.approvals enable row level security;
create policy "ver aprobaciones" on public.approvals for select using (public.is_smileat()); -- sin insert/update: solo vía decide()

-- Nadie puede tocar el estado a mano; cualquier cambio de contenido reinicia el proceso
create or replace function public.guard_creative() returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then new.approval_status:='draft'; new.final_path:=null; new.approved_version:=null; new.needs_marketing:=false; return new; end if;
  if current_setting('app.bypass',true)='1' then return new; end if;
  if new.spec is distinct from old.spec or new.product_id is distinct from old.product_id or new.market is distinct from old.market
     or new.format is distinct from old.format or new.channel is distinct from old.channel or new.type is distinct from old.type then
    new.version:=old.version+1; new.approval_status:='draft'; new.needs_marketing:=false; new.final_path:=null; new.approved_version:=null;
  else
    new.version:=old.version; new.approval_status:=old.approval_status; new.needs_marketing:=old.needs_marketing;
    new.approved_version:=old.approved_version; new.final_path:=old.final_path;
  end if;
  return new;
end $$;
drop trigger if exists guard_creative on public.creatives;
create trigger guard_creative before insert or update on public.creatives for each row execute function public.guard_creative();

create or replace function public.submit_for_review(p_id uuid) returns text language plpgsql security definer set search_path=public as $$
declare c creatives; dual boolean;
begin
  if not is_smileat() then raise exception 'No autorizado'; end if;
  select * into c from creatives where id=p_id; if not found then raise exception 'No existe la creatividad'; end if;
  if c.approval_status not in ('draft','changes_requested') then raise exception 'Estado no válido para enviar a revisión'; end if;
  select coalesce((select value='true' from app_settings where key='dual_approval_sensitive'),true) into dual;
  perform set_config('app.bypass','1',true);
  update creatives set approval_status='pending_design',
    needs_marketing = dual and c.type in ('Promoción','Ingredientes','Beneficios','Comparativa') where id=p_id;
  return 'pending_design';
end $$;

create or replace function public.decide(p_id uuid, p_stage text, p_decision text, p_comment text default null) returns text
language plpgsql security definer set search_path=public as $$
declare c creatives; r text:=my_role(); des boolean; mkt boolean;
begin
  if not is_smileat() then raise exception 'No autorizado'; end if;
  select * into c from creatives where id=p_id; if not found then raise exception 'No existe la creatividad'; end if;
  if c.approval_status<>'pending_design' then raise exception 'La creatividad no está pendiente de revisión'; end if;
  if p_stage='design' and r not in ('design','admin') then raise exception 'Solo Diseño puede decidir esta fase'; end if;
  if p_stage='marketing' and r not in ('marketing','admin') then raise exception 'Solo Marketing puede decidir esta fase'; end if;
  if p_stage='marketing' and not c.needs_marketing then raise exception 'Esta pieza no requiere aprobación de Marketing'; end if;
  if c.created_by=auth.uid() and r<>'admin' then raise exception 'No puedes revisar tu propia creatividad'; end if;
  if p_decision='changes_requested' and coalesce(trim(p_comment),'')='' then raise exception 'El comentario es obligatorio al pedir cambios'; end if;
  insert into approvals(creative_id,version,stage,decision,comment) values(p_id,c.version,p_stage,p_decision,p_comment);
  perform set_config('app.bypass','1',true);
  if p_decision='changes_requested' then update creatives set approval_status='changes_requested' where id=p_id; return 'changes_requested'; end if;
  select exists(select 1 from approvals where creative_id=p_id and version=c.version and stage='design' and decision='approved') into des;
  select exists(select 1 from approvals where creative_id=p_id and version=c.version and stage='marketing' and decision='approved') into mkt;
  if des and (not c.needs_marketing or mkt) then
    update creatives set approval_status='approved', approved_version=c.version where id=p_id; return 'approved'; end if;
  return 'pending_design';
end $$;

-- El archivo final se adjunta solo cuando está aprobada
create or replace function public.attach_final(p_id uuid, p_path text) returns void language plpgsql security definer set search_path=public as $$
declare c creatives;
begin
  if my_role() not in ('design','admin') then raise exception 'Solo Diseño puede adjuntar el archivo final'; end if;
  select * into c from creatives where id=p_id;
  if not found or c.approval_status<>'approved' then raise exception 'La creatividad no está aprobada'; end if;
  perform set_config('app.bypass','1',true);
  update creatives set final_path=p_path where id=p_id;
end $$;

-- Almacén de archivos finales: solo se pueden descargar los de piezas aprobadas y vigentes
insert into storage.buckets(id,name,public) values('final','final',false) on conflict do nothing;
create policy "subir final" on storage.objects for insert with check (bucket_id='final' and public.my_role() in ('design','admin'));
create policy "descargar solo aprobadas" on storage.objects for select using (
  bucket_id='final' and public.is_smileat() and exists(
    select 1 from public.creatives c where c.final_path=storage.objects.name and c.approval_status='approved' and c.approved_version=c.version));
-- Asignar roles: update public.profiles set role='design' where email='nombre@smileat.com';
