# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

There are no tests configured in this project.

## Architecture

This is a React + Vite app ("זיכרון 7.10") — a Hebrew-language memorial app documenting October 7, 2023 massacre sites in the Gaza envelope. QR code stickers placed at physical sites lead visitors to location pages with audio, images, and videos. The UI is fully RTL (`dir="rtl"`).

### Routing

Routing is handled in [src/pages/index.jsx](src/pages/index.jsx). All routes map 1:1 to page component names (e.g. `/admindashboard` → `AdminDashboard`). `createPageUrl(pageName)` in `src/utils/index.ts` converts a page name to its URL path (lowercased, spaces replaced with hyphens).

### Layouts

[src/pages/Layout.jsx](src/pages/Layout.jsx) selects the layout based on the current page name:
- Pages starting with `Admin` → `AdminLayout` (requires `user.role === 'admin'`, redirects to login/AccessDenied otherwise)
- `Login`, `AccessDenied`, `ResetPassword` → renders children directly (no layout)
- Everything else → `PublicLayout` (navbar + footer, auth is optional)

### API Layer (`src/api/`)

Backend is **Supabase** (PostgreSQL + Auth + Storage). Client is initialized in [src/api/supabaseClient.js](src/api/supabaseClient.js) using env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

- **[`entities.js`](src/api/entities.js)** — exports `Location` (Supabase table) and `User` (Supabase Auth + profiles). Entity methods: `.list(orderBy)`, `.filter(query)`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`.
- **[`integrations.js`](src/api/integrations.js)** — `UploadFile` (Supabase Storage, `media` bucket), `SendEmail` (stub).

### Auth & Roles

- Auth is handled via `supabase.auth` (email/password).
- Admin role is stored in `auth.users.raw_app_meta_data` (`app_metadata.role = 'admin'`), surfaced via JWT — **not** via the `profiles` table.
- `User.me()` returns `{ id, email, full_name, role }` derived from the Supabase session.
- Role changes go through the `set_user_role(target_user_id, new_role)` Supabase RPC (SECURITY DEFINER).
- A `handle_new_user()` DB trigger creates a `profiles` row on every signup.
- Auth pages: [src/pages/Login.jsx](src/pages/Login.jsx) (login + forgot password), [src/pages/ResetPassword.jsx](src/pages/ResetPassword.jsx) (reset link handler).

### Database

**Tables:** `locations`, `profiles`

**RLS policies:**
- `locations`: SELECT public (anon), INSERT/UPDATE/DELETE admin only (via JWT claim)
- `profiles`: SELECT own + SELECT admin (via JWT), INSERT own, UPDATE own

### UI Components

shadcn/ui components live in [src/components/ui/](src/components/ui/) (style: "new-york", icon library: lucide-react). Do not edit these generated files — use them as-is. Custom layout components are in [src/components/admin/](src/components/admin/) and [src/components/public/](src/components/public/).

### Path Aliases

`@/` resolves to `src/` (configured in `vite.config.js`). Use `@/components/...`, `@/api/...`, `@/utils`, etc. throughout.

### Styling

Tailwind CSS with CSS variables for theming. Primary color: `#1E3A5F` (dark blue). Background: `#F5F5F5` (light gray). Text: `#222222` / `#555555`. Admin area uses a dark `slate-900` theme.
