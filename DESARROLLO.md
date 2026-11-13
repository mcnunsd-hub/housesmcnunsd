# Desarrollo y despliegue local

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- Acceso al proyecto de Supabase `yxjexkwyjehsxtmtunfo` (el `.env` ya trae la URL y la publishable key).

## Instalación

```bash
npm install        # o: pnpm install
```

## Ejecutar en local

```bash
npm run dev
```

Por defecto Vite sirve en http://localhost:8080 (si el puerto está ocupado, usa el que indique la consola).

## Iniciar sesión con Google

El botón usa OAuth nativo de Supabase (`supabase.auth.signInWithOAuth({ provider: "google" })`),
no el broker de Lovable. Para que funcione, en **Supabase → Authentication → URL Configuration**
añade a *Redirect URLs* cada origen desde el que se abra la app:

- `http://localhost:8080/auth/callback`
- la URL del túnel público, por ejemplo `https://algo.trycloudflare.com/auth/callback`

En **Authentication → Providers → Google** deben estar configurados el Client ID y Secret de Google.

## Funciones de base de datos necesarias

La app funciona sin ellas, pero con funciones limitadas:

- **Solicitudes**: todos los registros quedan en `pending` sólo si existe `request_participant_review()`.
- **Eliminar participante**: sin `admin_delete_participant()` el botón «Eliminar» borra el perfil,
  los roles y los puntos, pero deja la ficha en `participants`.

Aplica el archivo `drizzle/migrations/0009_access_requests_and_participant_delete.sql`
desde **Supabase → SQL Editor** (o con `supabase db push`). Es idempotente.

## Secciones del panel

- `/admin` → pestañas Resumen, **Solicitudes** (sólo `super_admin`), Registro, Casas, Trivia, Misiones, Roles, Ajustes.
- La pestaña **Casas** incluye el botón **Eliminar** por participante.
- La sección **Auditoría** se retiró del panel de administración.

## Publicar cambios en GitHub

```bash
git add -A
git commit -m "Solicitudes de acceso, alta con Google y borrado de participantes"
git push origin main
```
