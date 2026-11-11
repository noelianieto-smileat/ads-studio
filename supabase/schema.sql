-- Ejecutar en Supabase → SQL Editor. Ajusta el dominio si cambia.
create or replace function public.is_smileat() returns boolean language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email','')) like '%@smileat.com' $$;

-- Defensa en profundidad: ninguna cuenta fuera del dominio puede registrarse
create or replace function public.block_foreign_domains() returns trigger language plpgsql security definer as $$
begin
  if lower(new.email) not like '%@smileat.com' then raise exception 'Dominio no permitido'; end if;
  return new; end $$;
drop trigger if exists block_foreign on auth.users;
create trigger block_foreign before insert on auth.users for each row execute function public.block_foreign_domains();

create table public.profiles(id uuid primary key references auth.users on delete cascade, email text, role text not null default 'user' check (role in ('admin','user')));
create or replace function public.new_profile() returns trigger language plpgsql security definer as $$
begin insert into public.profiles(id,email) values(new.id,new.email); return new; end $$;
create trigger on_auth_user after insert on auth.users for each row execute function public.new_profile();
create or replace function public.is_admin() returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;

create table public.products(id uuid primary key default gen_random_uuid(), name text not null, category text, image_path text, ingredients text, approved_claims text, markets text[] default '{ES,PT,IT}', created_by uuid default auth.uid(), created_at timestamptz default now());
create table public.creatives(id uuid primary key default gen_random_uuid(), product_id uuid references public.products on delete set null, market text, format text, channel text, type text, spec jsonb not null, review_status text default 'needs_adjustments', favorite boolean default false, version int default 1, parent_id uuid references public.creatives on delete set null, created_by uuid default auth.uid(), created_at timestamptz default now());
create table public.brand_docs(id uuid primary key default gen_random_uuid(), name text not null, kind text, file_path text, version int default 1, is_current boolean default true, uploaded_by uuid default auth.uid(), created_at timestamptz default now());

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.creatives enable row level security;
alter table public.brand_docs enable row level security;
create policy "perfil propio" on public.profiles for select using (public.is_smileat() and (id=auth.uid() or public.is_admin()));
create policy "ver" on public.products for select using (public.is_smileat());
create policy "crear" on public.products for insert with check (public.is_smileat());
create policy "editar" on public.products for update using (public.is_smileat());
create policy "borrar" on public.products for delete using (public.is_admin() or created_by=auth.uid());
create policy "ver" on public.creatives for select using (public.is_smileat());
create policy "crear" on public.creatives for insert with check (public.is_smileat());
create policy "editar" on public.creatives for update using (public.is_smileat());
create policy "borrar" on public.creatives for delete using (public.is_admin() or created_by=auth.uid());
create policy "ver" on public.brand_docs for select using (public.is_smileat());
create policy "admin gestiona" on public.brand_docs for all using (public.is_admin()) with check (public.is_admin());

-- Almacenamiento privado (sin acceso público)
insert into storage.buckets(id,name,public) values('brand','brand',false) on conflict do nothing;
create policy "leer brand" on storage.objects for select using (bucket_id='brand' and public.is_smileat());
create policy "subir brand" on storage.objects for insert with check (bucket_id='brand' and public.is_smileat());
create policy "borrar brand" on storage.objects for delete using (bucket_id='brand' and public.is_admin());
-- Primer administrador: update public.profiles set role='admin' where email='tu.nombre@smileat.com';
