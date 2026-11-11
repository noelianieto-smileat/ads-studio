# SMILEAT ADS STUDIO

Herramienta interna de creatividades para Paid Media. Next.js 14 + TypeScript + Supabase (auth, base de datos, almacenamiento privado) + Google OAuth restringido a `@smileat.com`.

## Estado
| Estado | Qué |
|---|---|
| Operativo | Login con Google; dominio validado en middleware, callback y trigger de base de datos; rutas protegidas; productos con importación masiva a almacenamiento privado; galería de lectura; roles admin/usuario en base de datos |
| Prototipo (`prototype/prototipo-v1.html`) | Flujo de 7 pasos, generación demo, editor, descargas PNG, iconos de frutas |
| Pendiente | Portar flujo/editor al proyecto y guardar en Supabase; IA de imágenes y textos; lectura de manuales por la IA; plantillas; ZIP por mercado/producto/campaña/canal/formato |

## Aprobación de creatividades (Diseño)
Tras `schema.sql`, ejecuta `supabase/migrations/002_approvals.sql`. Estados: borrador → pendiente → aprobada / cambios solicitados.
- Roles: `admin`, `design`, `marketing`, `user` (se asignan con `update public.profiles set role='design' where email='...';`).
- Solo Diseño (y admin) aprueba la fase de diseño; las piezas de Promoción, Ingredientes, Beneficios y Comparativa necesitan además a Marketing (ajuste `dual_approval_sensitive`).
- Nadie aprueba su propia pieza (salvo admin). Pedir cambios exige comentario. Cualquier edición reinicia el proceso y sube la versión.
- El archivo final vive en el bucket privado `final` y solo se puede descargar si la pieza está aprobada y vigente (lo exige la base de datos, no la interfaz).
- Pendiente: pantallas para enviar/aprobar y adjuntar el archivo final. Hoy el archivo lo renderiza el navegador de quien aprueba; el renderizado en servidor es una mejora futura.
- El SQL no se ha ejecutado aún contra un Supabase real: pruébalo en un proyecto de prueba primero.

## Despliegue en Netlify
Netlify detecta Next.js y añade su adaptador automáticamente; el middleware (protección de rutas) se ejecuta como Edge Function. Pasos: Add new site → Import from Git → elegir el repositorio → añadir las variables de `.env.example` en Environment variables **antes** del primer deploy (si las añades después, hay que lanzar un nuevo deploy) → Deploy. Después poner la URL resultante en Supabase (Site URL y Redirect URLs) y en Google (orígenes autorizados).

## 1. Supabase
1. Crea un proyecto en supabase.com (región UE).
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Project Settings → API: copia URL y `anon key`.
4. Para el primer administrador, entra una vez y ejecuta: `update public.profiles set role='admin' where email='tu.nombre@smileat.com';`

## 2. Google OAuth (lo hace alguien con acceso a Google Cloud/Workspace)
1. console.cloud.google.com → APIs y servicios → Pantalla de consentimiento: tipo **Interno** (limita a la organización Smileat).
2. Credenciales → ID de cliente OAuth → Aplicación web.
3. URI de redireccionamiento autorizado: `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
4. En Supabase → Authentication → Providers → Google: pega Client ID y Secret.
5. Authentication → URL Configuration: Site URL = tu dominio de producción; Redirect URLs: `https://TU-DOMINIO/auth/callback` y `http://localhost:3000/auth/callback`.

## 3. Local
```bash
cp .env.example .env.local   # rellena las variables
npm install
npm run dev                  # http://localhost:3000
```

## 4. GitHub (repositorio privado) y despliegue
```bash
git init && git add . && git commit -m "SMILEAT ADS STUDIO v0.1"
git branch -M main
git remote add origin git@github.com:TU-ORG/smileat-ads-studio.git   # repo creado como PRIVADO
git push -u origin main
```
Despliegue en Vercel: Import Project → elige el repositorio → añade las variables de `.env.example` → Deploy. Después añade el dominio de producción en las URLs de Supabase (paso 2.5).

## Variables de entorno
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexión a Supabase (la anon key es pública; la seguridad la dan las políticas RLS) |
| `ALLOWED_EMAIL_DOMAIN` | Dominio permitido (`smileat.com`). Si lo cambias, cambia también `schema.sql` |
| `ANTHROPIC_API_KEY`, `IMAGE_API_KEY` | Futuras integraciones. Solo servidor, nunca `NEXT_PUBLIC_` |

## Seguridad
- Sin sesión de `@smileat.com` no se accede a ninguna ruta (middleware) ni a datos (RLS) ni a archivos (bucket privado con URLs firmadas de 1 h).
- Nunca subas `.env.local`. No uses la `service_role` key en el navegador.
- No se usan los materiales de Smileat para entrenar modelos; al conectar IA, revisa los términos de retención del proveedor.

## Actualizar contenido
- **Productos:** Productos y recursos → importar fotos (nombre de archivo = nombre del producto).
- **Manuales y recursos:** tabla `brand_docs` y bucket `brand` (gestión por admin; interfaz en la siguiente fase). Se usa la fila con `is_current = true`.

## Cargar los productos desde el export de Shopify
**Opción A, sin instalar nada:** Productos y recursos → «Importar desde el CSV de Shopify» → sube el CSV. Quita los productos de Portugal (SKU `PT-`), mantiene packs/promos/regalos y descarga la foto en posición 1. Si el servidor de imágenes de Shopify no permite la descarga desde el navegador, la herramienta lo indica y se suben esas fotos a mano con «Importar varios productos». Revisa que la foto sea el envase y no una foto de ambiente.
**Opción B (alternativa):** `tools/descargar_fotos.py` hace lo mismo desde Python y deja las fotos en una carpeta.
