# Contenu complet des fichiers modifiés — NDC COSPLAY

Le fichier `src/routes/admin.tsx` est volontairement limité aux extraits d'intégration photo demandés, car il s'agit d'un gros fichier. Le projet corrigé complet est fourni dans l'archive ZIP.


## `.env.example`

````dotenv
# Variables serveur à définir dans votre environnement local et sur Vercel
ADMIN_EMAIL=
ADMIN_PASSWORD=
SESSION_SECRET=
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
````


## `.gitignore`

````text
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
.output
.vinxi
.tanstack/**
.nitro
*.local

# Wrangler / Cloudflare
.wrangler/
.dev.vars

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment secrets
.env
.env.*
!.env.example

# Vercel
.vercel
````


## `README.md`

````markdown
# NDC COSPLAY

Boutique de cosplay sur mesure. Stack : TanStack Start, React, TypeScript, Tailwind CSS v4, Neon PostgreSQL, Vercel Blob et Vercel.

## Prérequis

- Node.js compatible avec la version indiquée par Vercel pour le projet.
- Un projet PostgreSQL chez Neon.
- Un store Vercel Blob avec accès en écriture.
- Un compte Vercel pour le déploiement.

## Configuration locale

1. Installer les dépendances : `npm install`.
2. Copier `.env.example` vers `.env` et renseigner les cinq variables ci-dessous.
3. Exécuter `schema.sql` dans l'éditeur SQL de Neon.
4. Lancer le site : `npm run dev`.

Ne commitez jamais le fichier `.env` ni les valeurs des secrets.

## Variables d'environnement

- `ADMIN_EMAIL` : adresse utilisée pour se connecter à l'administration.
- `ADMIN_PASSWORD` : mot de passe administrateur d'au moins 12 caractères.
- `SESSION_SECRET` : secret aléatoire d'au moins 32 caractères pour signer les sessions.
- `DATABASE_URL` : chaîne de connexion PostgreSQL Neon. Utilisez la chaîne adaptée au runtime/serverless fournie par Neon.
- `BLOB_READ_WRITE_TOKEN` : jeton du store Vercel Blob, utilisé uniquement côté serveur pour autoriser les téléversements et suppressions.

Les trois variables d'administration, `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` doivent être définies dans les environnements Vercel Preview et Production selon les besoins. Après tout changement, redéployez le projet.

## Base de données

Le fichier `schema.sql` crée les tables `settings`, `products`, `home_images`, `orders` et `rate_limits`, la séquence des numéros de commande et la fonction SQL `create_order`. Le schéma est idempotent et ne charge aucune donnée de démonstration. La ligne initiale de paramètres est vide, à compléter depuis l'administration.

Les commandes sont créées par la fonction SQL afin de recalculer leur prix côté serveur. Les tentatives de commande, de connexion admin et de suivi sont limitées par des compteurs persistés dans Neon.

## Photos

Les images sont compressées dans le navigateur en WebP, avec un côté long maximal de 1600 px, puis envoyées directement à Vercel Blob. Les photos ne sont pas stockées dans le système de fichiers éphémère de Vercel. Seules leurs URL sont conservées dans Neon.

Formats d'origine acceptés : JPEG, PNG et WebP, jusqu'à 5 Mo avant compression.

## Déploiement Vercel

1. Poussez le dépôt sur GitHub et importez-le dans Vercel.
2. Configurez les cinq variables d'environnement.
3. Vérifiez que le projet Neon est accessible depuis le runtime Vercel.
4. Lancez le déploiement puis vérifiez les logs de build et de fonctions.
5. Testez la connexion admin, la création et le suivi d'une commande, l'ajout/suppression d'une photo et la persistance d'une photo après redéploiement.

## Commandes utiles

- `npm run dev` : développement local.
- `npm run build` : build de production.
- `npm run test` : tests automatisés.
- `npm run lint` : lint ESLint.
````


## `drizzle.config.ts`

````typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
````


## `drizzle/migrations/0000_migration.sql`

````sql
-- Schéma NDC COSPLAY pour Neon PostgreSQL. Exécutable plusieurs fois sans recréer les tables.
create extension if not exists pgcrypto;

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp text not null default '',
  instagram text not null default '',
  tiktok text,
  email text not null default '',
  deposit_percent integer,
  urgent_fee_percent integer,
  delivery_zones jsonb not null default '[]'::jsonb,
  logo_text text not null default 'NDC COSPLAY',
  logo_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('anime','marvel','dc','jeux','armes')),
  universe text not null default '',
  description text not null default '',
  base_price integer,
  weapon_price integer,
  accessories_price integer,
  weapon_only_price integer,
  accessories_only_price integer,
  production_days integer,
  urgent_days integer,
  images text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.home_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text not null default '',
  kind text not null default 'carousel' check (kind in ('hero','carousel','category','gallery')),
  category_key text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.home_images add column if not exists category_key text;

create sequence if not exists public.order_number_seq start with 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('NDC-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  mode text not null check (mode in ('cosplay','armes','accessoires','armes_accessoires')),
  with_weapon boolean not null default false,
  with_accessories boolean not null default false,
  urgent boolean not null default false,
  gender text,
  size text,
  measurements jsonb,
  unsure_size boolean not null default false,
  first_name text not null,
  last_name text not null,
  phone text not null,
  phone_key text not null default '',
  address text not null,
  total integer,
  payment_preference text not null default 'moitie',
  payment_received text not null default 'non' check (payment_received in ('non','acompte','total')),
  internal_notes text not null default '',
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_track_idx on public.orders (order_number, phone_key);

create table if not exists public.rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);
create index if not exists rate_limits_updated_at_idx on public.rate_limits (updated_at);

insert into public.settings (id) values (1) on conflict (id) do nothing;

create or replace function public.create_order(p jsonb, p_client_key text)
returns table(order_number text, total integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  pr public.products%rowtype;
  st public.settings%rowtype;
  v_mode text := coalesce(p->>'mode','cosplay');
  v_weapon boolean := coalesce((p->>'with_weapon')::boolean,false);
  v_acc boolean := coalesce((p->>'with_accessories')::boolean,false);
  v_urgent boolean := coalesce((p->>'urgent')::boolean,false);
  v_total integer;
  v_phone text := regexp_replace(coalesce(p->>'phone',''), '[^0-9+]', '', 'g');
  v_key text := coalesce(p_client_key, 'fallback:unknown');
  v_limit integer;
  v_hits integer;
  v_order_number text;
begin
  v_limit := case when v_key like 'fallback:%' then 2 else 5 end;
  insert into public.rate_limits(scope,key_hash,window_started_at,hits,updated_at)
  values ('create-order', v_key, now(), 1, now())
  on conflict (scope,key_hash) do update set
    hits = case when rate_limits.window_started_at < now() - interval '10 minutes' then 1 else rate_limits.hits + 1 end,
    window_started_at = case when rate_limits.window_started_at < now() - interval '10 minutes' then now() else rate_limits.window_started_at end,
    updated_at = now()
  returning hits into v_hits;
  if v_hits > v_limit then raise exception 'RATE_LIMIT'; end if;

  select * into pr from public.products where id = (p->>'product_id')::uuid and active = true;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  select * into st from public.settings where id = 1;

  if length(trim(coalesce(p->>'first_name',''))) not between 1 and 80
     or length(trim(coalesce(p->>'last_name',''))) not between 1 and 80
     or length(trim(coalesce(p->>'address',''))) not between 3 and 300 then
    raise exception 'INVALID_CUSTOMER';
  end if;
  if v_phone !~ '^(\+?221)?7[05678][0-9]{7}$' then raise exception 'BAD_PHONE'; end if;

  if v_mode = 'cosplay' then
    v_total := pr.base_price
      + case when v_weapon then coalesce(pr.weapon_price,0) else 0 end
      + case when v_acc then coalesce(pr.accessories_price,0) else 0 end;
    v_weapon := v_weapon and pr.weapon_price is not null;
    v_acc := v_acc and pr.accessories_price is not null;
  elsif v_mode = 'armes' then
    if pr.weapon_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.weapon_only_price; v_weapon := true; v_acc := false;
  elsif v_mode = 'accessoires' then
    if pr.accessories_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.accessories_only_price; v_weapon := false; v_acc := true;
  elsif v_mode = 'armes_accessoires' then
    if pr.weapon_only_price is null or pr.accessories_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.weapon_only_price + pr.accessories_only_price; v_weapon := true; v_acc := true;
  else
    raise exception 'BAD_MODE';
  end if;

  if v_total is not null and v_urgent and st.urgent_fee_percent is not null and pr.urgent_days is not null then
    v_total := v_total + round(v_total * st.urgent_fee_percent / 100.0)::integer;
  end if;

  insert into public.orders (
    product_id,product_name,mode,with_weapon,with_accessories,urgent,gender,size,measurements,
    unsure_size,first_name,last_name,phone,phone_key,address,total,payment_preference
  ) values (
    pr.id,pr.name,v_mode,v_weapon,v_acc,v_urgent,left(p->>'gender',20),left(p->>'size',10),
    case when jsonb_typeof(p->'measurements') = 'object' then p->'measurements' else null end,
    coalesce((p->>'unsure_size')::boolean,false),left(trim(p->>'first_name'),80),
    left(trim(p->>'last_name'),80),v_phone,right(regexp_replace(v_phone,'[^0-9]','','g'),9),
    left(trim(p->>'address'),300),v_total,coalesce(p->>'payment_preference','moitie')
  ) returning orders.order_number, orders.total into v_order_number, total;
  order_number := v_order_number;
  return next;
end;
$$;

-- Nettoyage régulier des clés anti-abus expirées (peut aussi être lancé manuellement).
delete from public.rate_limits where updated_at < now() - interval '30 days';
````


## `package.json`

````json
{
  "name": "tanstack_start_ts",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "scripts": {
    "dev": "vite dev --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "overrides": {
    "rolldown": "1.2.1"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/vite": "^4.2.1",
    "@tanstack/react-query": "^5.101.1",
    "@tanstack/react-router": "1.170.41",
    "@tanstack/react-start": "1.168.60",
    "@tanstack/router-plugin": "1.168.42",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^14.1.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.5",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.1",
    "tw-animate-css": "^1.3.4",
    "vaul": "^1.1.2",
    "vite-tsconfig-paths": "^6.0.2",
    "zod": "^4.6.5",
    "@neondatabase/serverless": "^1.0.2",
    "@vercel/blob": "^2.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@lovable.dev/vite-tanstack-config": "2.26.5",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.16.5",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "drizzle-kit": "0.x",
    "drizzle-orm": "0.x",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "jsdom": "^20.0.3",
    "nitro": "3.0.260603-beta",
    "postgres": "^3.4.9",
    "prettier": "^3.7.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.56.1",
    "vite": "8.1.5",
    "vitest": "^4.1.10"
  }
}
````


## `schema.sql`

````sql
-- Schéma NDC COSPLAY pour Neon PostgreSQL. Exécutable plusieurs fois sans recréer les tables.
create extension if not exists pgcrypto;

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp text not null default '',
  instagram text not null default '',
  tiktok text,
  email text not null default '',
  deposit_percent integer,
  urgent_fee_percent integer,
  delivery_zones jsonb not null default '[]'::jsonb,
  logo_text text not null default 'NDC COSPLAY',
  logo_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('anime','marvel','dc','jeux','armes')),
  universe text not null default '',
  description text not null default '',
  base_price integer,
  weapon_price integer,
  accessories_price integer,
  weapon_only_price integer,
  accessories_only_price integer,
  production_days integer,
  urgent_days integer,
  images text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.home_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text not null default '',
  kind text not null default 'carousel' check (kind in ('hero','carousel','category','gallery')),
  category_key text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.home_images add column if not exists category_key text;

create sequence if not exists public.order_number_seq start with 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('NDC-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  mode text not null check (mode in ('cosplay','armes','accessoires','armes_accessoires')),
  with_weapon boolean not null default false,
  with_accessories boolean not null default false,
  urgent boolean not null default false,
  gender text,
  size text,
  measurements jsonb,
  unsure_size boolean not null default false,
  first_name text not null,
  last_name text not null,
  phone text not null,
  phone_key text not null default '',
  address text not null,
  total integer,
  payment_preference text not null default 'moitie',
  payment_received text not null default 'non' check (payment_received in ('non','acompte','total')),
  internal_notes text not null default '',
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_track_idx on public.orders (order_number, phone_key);

create table if not exists public.rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);
create index if not exists rate_limits_updated_at_idx on public.rate_limits (updated_at);

insert into public.settings (id) values (1) on conflict (id) do nothing;

create or replace function public.create_order(p jsonb, p_client_key text)
returns table(order_number text, total integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  pr public.products%rowtype;
  st public.settings%rowtype;
  v_mode text := coalesce(p->>'mode','cosplay');
  v_weapon boolean := coalesce((p->>'with_weapon')::boolean,false);
  v_acc boolean := coalesce((p->>'with_accessories')::boolean,false);
  v_urgent boolean := coalesce((p->>'urgent')::boolean,false);
  v_total integer;
  v_phone text := regexp_replace(coalesce(p->>'phone',''), '[^0-9+]', '', 'g');
  v_key text := coalesce(p_client_key, 'fallback:unknown');
  v_limit integer;
  v_hits integer;
  v_order_number text;
begin
  v_limit := case when v_key like 'fallback:%' then 2 else 5 end;
  insert into public.rate_limits(scope,key_hash,window_started_at,hits,updated_at)
  values ('create-order', v_key, now(), 1, now())
  on conflict (scope,key_hash) do update set
    hits = case when rate_limits.window_started_at < now() - interval '10 minutes' then 1 else rate_limits.hits + 1 end,
    window_started_at = case when rate_limits.window_started_at < now() - interval '10 minutes' then now() else rate_limits.window_started_at end,
    updated_at = now()
  returning hits into v_hits;
  if v_hits > v_limit then raise exception 'RATE_LIMIT'; end if;

  select * into pr from public.products where id = (p->>'product_id')::uuid and active = true;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  select * into st from public.settings where id = 1;

  if length(trim(coalesce(p->>'first_name',''))) not between 1 and 80
     or length(trim(coalesce(p->>'last_name',''))) not between 1 and 80
     or length(trim(coalesce(p->>'address',''))) not between 3 and 300 then
    raise exception 'INVALID_CUSTOMER';
  end if;
  if v_phone !~ '^(\+?221)?7[05678][0-9]{7}$' then raise exception 'BAD_PHONE'; end if;

  if v_mode = 'cosplay' then
    v_total := pr.base_price
      + case when v_weapon then coalesce(pr.weapon_price,0) else 0 end
      + case when v_acc then coalesce(pr.accessories_price,0) else 0 end;
    v_weapon := v_weapon and pr.weapon_price is not null;
    v_acc := v_acc and pr.accessories_price is not null;
  elsif v_mode = 'armes' then
    if pr.weapon_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.weapon_only_price; v_weapon := true; v_acc := false;
  elsif v_mode = 'accessoires' then
    if pr.accessories_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.accessories_only_price; v_weapon := false; v_acc := true;
  elsif v_mode = 'armes_accessoires' then
    if pr.weapon_only_price is null or pr.accessories_only_price is null then raise exception 'OPTION_UNAVAILABLE'; end if;
    v_total := pr.weapon_only_price + pr.accessories_only_price; v_weapon := true; v_acc := true;
  else
    raise exception 'BAD_MODE';
  end if;

  if v_total is not null and v_urgent and st.urgent_fee_percent is not null and pr.urgent_days is not null then
    v_total := v_total + round(v_total * st.urgent_fee_percent / 100.0)::integer;
  end if;

  insert into public.orders (
    product_id,product_name,mode,with_weapon,with_accessories,urgent,gender,size,measurements,
    unsure_size,first_name,last_name,phone,phone_key,address,total,payment_preference
  ) values (
    pr.id,pr.name,v_mode,v_weapon,v_acc,v_urgent,left(p->>'gender',20),left(p->>'size',10),
    case when jsonb_typeof(p->'measurements') = 'object' then p->'measurements' else null end,
    coalesce((p->>'unsure_size')::boolean,false),left(trim(p->>'first_name'),80),
    left(trim(p->>'last_name'),80),v_phone,right(regexp_replace(v_phone,'[^0-9]','','g'),9),
    left(trim(p->>'address'),300),v_total,coalesce(p->>'payment_preference','moitie')
  ) returning orders.order_number, orders.total into v_order_number, total;
  order_number := v_order_number;
  return next;
end;
$$;

-- Nettoyage régulier des clés anti-abus expirées (peut aussi être lancé manuellement).
delete from public.rate_limits where updated_at < now() - interval '30 days';
````


## `vite.config.ts`

````typescript
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  vite: {
    plugins: [nitro({ preset: "vercel" })],
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
````


## `vercel.json`

````json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "tanstack-start"
}
````


## `cleanup_legacy_uploads.sql`

````sql
-- À exécuter une fois dans Neon si l'ancienne version a enregistré des chemins /uploads/.
-- Retire les références de photos locales devenues indisponibles sur Vercel.
update public.products
set images = coalesce((
  select array_agg(url)
  from unnest(images) as url
  where url not like '/uploads/%'
), '{}'::text[])
where exists (select 1 from unnest(images) as image_url(url) where url like '/uploads/%');

delete from public.home_images where url like '/uploads/%';
````


## `src/lib/admin.server.ts`

````typescript
import crypto from "crypto";
import { del } from "@vercel/blob";
import { clientKey, consumeRateLimit, neonExecute, neonQuery } from "./neon.server";
import type {
  CategoryKey,
  HomeImage,
  Order,
  OrderStatus,
  PaymentReceived,
  Product,
  Settings,
} from "./types";

export const ADMIN_EMAIL = process.env["ADMIN_EMAIL"]?.trim() ?? "";
export const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "";
export const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "";

function adminConfigurationError(): string | null {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET) {
    return "Configuration administrateur incomplète : définis ADMIN_EMAIL, ADMIN_PASSWORD et SESSION_SECRET dans les variables d’environnement.";
  }
  if (ADMIN_PASSWORD.length < 12) return "ADMIN_PASSWORD doit contenir au moins 12 caractères.";
  if (SESSION_SECRET.length < 32) return "SESSION_SECRET doit contenir au moins 32 caractères.";
  return null;
}

const COOKIE_NAME = "ndc_admin_session";
const LOCKOUT_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
    }),
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (!safeCompare(sigB64, expectedSig)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as {
      email?: string;
      exp?: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return false;
    if (payload.email !== ADMIN_EMAIL) return false;
    return true;
  } catch {
    return false;
  }
}

async function safeGetCookie(): Promise<string> {
  try {
    const s = await import("@tanstack/react-start/server");
    return s.getRequestHeader("cookie") ?? "";
  } catch {
    return "";
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const cookieHeader = await safeGetCookie();
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (!match || !match[1]) return false;
    return verifySessionToken(decodeURIComponent(match[1]));
  } catch {
    return false;
  }
}

export async function assertAdminAuth() {
  if (!(await isUserAuthenticated())) {
    throw new Error("UNAUTHORIZED: Session administrateur requise");
  }
}

async function safeSetSessionCookie(token: string) {
  try {
    const s = await import("@tanstack/react-start/server");
    s.setResponseHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  } catch {
    // Dans l'environnement de test direct
  }
}

async function safeClearSessionCookie() {
  try {
    const s = await import("@tanstack/react-start/server");
    s.setResponseHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  } catch {
    // Dans l'environnement de test direct
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function handleAdminCheckAuth(): Promise<{ authenticated: boolean; email?: string }> {
  const ok = await isUserAuthenticated();
  return {
    authenticated: ok,
    email: ok ? ADMIN_EMAIL : undefined,
  };
}

export async function handleAdminLogin(
  data: { email: string; password: string },
  clientIp?: string,
): Promise<
  { ok: true } | { ok: false; error: "invalid_credentials" | "locked_out"; message: string }
> {
  const ip = clientIp || (await clientKey());
  const configError = adminConfigurationError();
  if (configError) return { ok: false, error: "invalid_credentials", message: configError };

  // 1. Vérification du blocage anti force-brute (15 min / 5 échecs)
  const effectiveAttemptLimit = ip.startsWith("fallback:") ? 3 : MAX_FAILED_ATTEMPTS;
  const attemptsAllowed = await consumeRateLimit("admin-login", ip, effectiveAttemptLimit, LOCKOUT_MINUTES * 60);
  const { rows: attemptRows } = await neonQuery<{ hits: number }>(
    "select hits from rate_limits where scope = $1 and key_hash = $2",
    ["admin-login", ip],
  );
  const attemptsCount = Number(attemptRows[0]?.hits ?? 0);
  if (!attemptsAllowed || attemptsCount > effectiveAttemptLimit) {
    return {
      ok: false,
      error: "locked_out",
      message: `Compte temporairement bloqué suite à ${effectiveAttemptLimit} tentatives échouées. Réessayez dans ${LOCKOUT_MINUTES} minutes.`,
    };
  }

  // 2. Vérification des identifiants (email strict + mot de passe sécurisé)
  const emailMatches = safeCompare(data.email.toLowerCase(), ADMIN_EMAIL.toLowerCase());
  const passMatches = safeCompare(data.password, ADMIN_PASSWORD);

  if (!emailMatches || !passMatches) {

    const remaining = Math.max(0, effectiveAttemptLimit - attemptsCount);
    const message =
      remaining > 0
        ? `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} avant blocage de 15 min.`
        : `Identifiants incorrects. Compte bloqué pendant ${LOCKOUT_MINUTES} minutes.`;

    return {
      ok: false,
      error: remaining > 0 ? "invalid_credentials" : "locked_out",
      message,
    };
  }

  // 3. Succès : efface les échecs et génère le cookie
  await neonExecute("delete from rate_limits where scope = $1 and key_hash = $2", ["admin-login", ip]);
  const token = signSession(ADMIN_EMAIL);
  await safeSetSessionCookie(token);
  return { ok: true };
}

export async function handleAdminLogout() {
  await safeClearSessionCookie();
  return { ok: true };
}

export async function handleAdminGetOrders(status?: string): Promise<Order[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Order>("select * from orders order by created_at desc");
  if (status && status !== "all") {
    return rows.filter((o) => o.status === status);
  }
  return rows;
}

export async function handleAdminUpdateOrderStatus(orderId: string, status: OrderStatus) {
  await assertAdminAuth();
  await neonExecute("update orders set status = $1 where id = $2", [status, orderId]);
  return { ok: true };
}

export async function handleAdminUpdateOrderPayment(
  orderId: string,
  paymentReceived: PaymentReceived,
) {
  await assertAdminAuth();
  await neonExecute("update orders set payment_received = $1 where id = $2", [
    paymentReceived,
    orderId,
  ]);
  return { ok: true };
}

export async function handleAdminUpdateOrderNotes(orderId: string, notes: string) {
  await assertAdminAuth();
  await neonExecute("update orders set internal_notes = $1 where id = $2", [notes, orderId]);
  return { ok: true };
}

export async function handleAdminDeleteOrder(orderId: string) {
  await assertAdminAuth();
  await neonExecute("delete from orders where id = $1", [orderId]);
  return { ok: true };
}

export async function handleAdminGetProducts(): Promise<Product[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Product>("select * from products order by created_at desc");
  return rows;
}

export async function handleAdminSaveProduct(
  data: Partial<Product> & { name: string; category: CategoryKey },
): Promise<{ ok: true; product: Product }> {
  await assertAdminAuth();
  const isNew = !data.id;
  const id = data.id || crypto.randomUUID();
  const baseSlug = slugify(data.name) || "cosplay";
  const slug = isNew ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const payload: Product & { created_at?: string } = {
    id,
    slug,
    name: data.name,
    category: data.category,
    universe: data.universe ?? "",
    description: data.description ?? "",
    base_price: data.base_price ?? null,
    weapon_price: data.weapon_price ?? null,
    accessories_price: data.accessories_price ?? null,
    weapon_only_price: data.weapon_only_price ?? null,
    accessories_only_price: data.accessories_only_price ?? null,
    production_days: data.production_days ?? null,
    urgent_days: data.urgent_days ?? null,
    featured: Boolean(data.featured ?? false),
    active: data.active !== undefined ? Boolean(data.active) : true,
    images: data.images ?? [],
    created_at: new Date().toISOString(),
  };

  if (isNew) {
    await neonExecute(
      `insert into products (id, slug, name, category, universe, description, base_price, weapon_price, accessories_price, weapon_only_price, accessories_only_price, production_days, urgent_days, images, featured, active)
       values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, slug, payload.name, payload.category, payload.universe, payload.description, payload.base_price, payload.weapon_price, payload.accessories_price, payload.weapon_only_price, payload.accessories_only_price, payload.production_days, payload.urgent_days, payload.images, payload.featured, payload.active],
    );
  } else {
    await neonExecute(
      `update products set slug=$1,name=$2,category=$3,universe=$4,description=$5,base_price=$6,weapon_price=$7,accessories_price=$8,weapon_only_price=$9,accessories_only_price=$10,production_days=$11,urgent_days=$12,images=$13,featured=$14,active=$15 where id=$16::uuid`,
      [slug, payload.name, payload.category, payload.universe, payload.description, payload.base_price, payload.weapon_price, payload.accessories_price, payload.weapon_only_price, payload.accessories_only_price, payload.production_days, payload.urgent_days, payload.images, payload.featured, payload.active, id],
    );
  }

  return { ok: true, product: payload };
}

export async function handleAdminToggleProductActive(productId: string, active: boolean) {
  await assertAdminAuth();
  await neonExecute("update products set active = $1 where id = $2::uuid", [active, productId]);
  return { ok: true };
}

export async function handleAdminDuplicateProduct(
  productId: string,
): Promise<{ ok: true; product: Product }> {
  await assertAdminAuth();
  const { rows } = await neonQuery<Product>("select * from products where id = $1 limit 1", [
    productId,
  ]);
  const src = rows[0];
  if (!src) throw new Error("Produit introuvable");

  const newId = crypto.randomUUID();
  const newSlug = `${src.slug}-copie-${Date.now().toString(36).slice(-4)}`;
  const clone: Product & { created_at: string } = {
    ...src,
    id: newId,
    name: `${src.name} (Copie)`,
    slug: newSlug,
    created_at: new Date().toISOString(),
  };

  await neonExecute(
    `insert into products (id,slug,name,category,universe,description,base_price,weapon_price,accessories_price,weapon_only_price,accessories_only_price,production_days,urgent_days,images,featured,active)
     values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [clone.id,clone.slug,clone.name,clone.category,clone.universe,clone.description,clone.base_price,clone.weapon_price,clone.accessories_price,clone.weapon_only_price,clone.accessories_only_price,clone.production_days,clone.urgent_days,clone.images,clone.featured,clone.active],
  );
  return { ok: true, product: clone };
}

export async function handleAdminDeleteProduct(productId: string) {
  await assertAdminAuth();
  await neonExecute("delete from products where id = $1", [productId]);
  return { ok: true };
}

export async function handleAdminGetHomeImages(): Promise<HomeImage[]> {
  await assertAdminAuth();
  const { rows } = await neonQuery<HomeImage>(
    "select * from home_images order by position, created_at",
  );
  return rows;
}

export async function handleAdminSaveHomeImage(data: {
  id?: string;
  url: string;
  caption?: string;
  kind: "hero" | "carousel" | "category" | "gallery";
  category_key?: "anime" | "marvel" | "dc" | "jeux" | "armes" | null;
  position?: number;
}) {
  await assertAdminAuth();
  if (data.kind === "hero") {
    const { rows } = await neonQuery<HomeImage>("select * from home_images");
    const existingHero = rows.find((r) => r.kind === "hero");
    if (existingHero) {
      await neonExecute("delete from home_images where id = $1", [existingHero.id]);
    }
  } else if (data.kind === "category" && data.category_key) {
    const { rows } = await neonQuery<HomeImage>("select * from home_images");
    const existing = rows.find(
      (r) => r.kind === "category" && r.category_key === data.category_key,
    );
    if (existing) {
      await neonExecute("delete from home_images where id = $1", [existing.id]);
    }
  }

  await neonExecute(
    `insert into home_images (id,url,caption,kind,category_key,position)
     values (coalesce($1::uuid,gen_random_uuid()),$2,$3,$4,$5,$6)
     on conflict (id) do update set url=excluded.url,caption=excluded.caption,kind=excluded.kind,category_key=excluded.category_key,position=excluded.position`,
    [data.id ?? null, data.url, data.caption ?? "", data.kind, data.category_key ?? null, data.position ?? 0],
  );
  return { ok: true };
}

export async function handleAdminDeleteHomeImage(id: string) {
  await assertAdminAuth();
  await neonExecute("delete from home_images where id = $1", [id]);
  return { ok: true };
}

export async function handleAdminReorderHomeImages(items: { id: string; position: number }[]) {
  await assertAdminAuth();
  for (const item of items) {
    await neonExecute("update home_images set position = $1 where id = $2", [
      item.position,
      item.id,
    ]);
  }
  return { ok: true };
}

export async function handleAdminDeletePhotoFile(url: string) {
  await assertAdminAuth();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) throw new Error("Configuration manquante : BLOB_READ_WRITE_TOKEN.");
  if (url.startsWith("https://") && url.includes(".public.blob.vercel-storage.com/")) {
    await del(url, { token: blobToken });
  } else if (url.startsWith("/uploads/")) {
    // Les anciens fichiers locaux ne sont plus servis par Vercel.
    return { ok: true };
  } else {
    throw new Error("URL de photo invalide.");
  }
  return { ok: true };
}

export async function handleAdminUpdateSettings(data: Settings) {
  await assertAdminAuth();
  await neonExecute(
    `insert into settings (id,whatsapp,instagram,tiktok,email,deposit_percent,urgent_fee_percent,delivery_zones,logo_text,logo_url)
     values (1,$1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
     on conflict (id) do update set whatsapp=excluded.whatsapp,instagram=excluded.instagram,tiktok=excluded.tiktok,email=excluded.email,deposit_percent=excluded.deposit_percent,urgent_fee_percent=excluded.urgent_fee_percent,delivery_zones=excluded.delivery_zones,logo_text=excluded.logo_text,logo_url=excluded.logo_url,updated_at=now()`,
    [data.whatsapp, data.instagram, data.tiktok, data.email, data.deposit_percent, data.urgent_fee_percent, JSON.stringify(data.delivery_zones ?? []), data.logo_text, data.logo_url],
  );
  return { ok: true };
}
````


## `src/lib/neon.server.ts`

````typescript
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";

export type NeonResult<R = Record<string, unknown>> = {
  rows: R[];
  rowCount: number | null;
  command: string;
};
export type NeonError = Error & { status?: number; code?: string; neonMessage?: string };

const SERVICE_ERROR = "Service momentanément indisponible, réessaie ou contacte-nous sur WhatsApp";
let cachedUrl = "";
let cachedSql: ReturnType<typeof neon> | undefined;

function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("Configuration serveur manquante : DATABASE_URL doit être définie.");
  if (cachedSql && cachedUrl === url) return cachedSql;
  cachedUrl = url;
  cachedSql = neon(url);
  return cachedSql;
}

function commandOf(query: string): string {
  return query.trim().match(/^(select|insert|update|delete|with|create|alter|drop|truncate|call|set|begin|commit|rollback)/i)?.[1]?.toUpperCase() ?? "UNKNOWN";
}

function normalizeError(error: unknown): NeonError {
  const source = error instanceof Error ? error : new Error(SERVICE_ERROR);
  const originalMessage = source.message;
  const e = source as NeonError;
  e.neonMessage = originalMessage;
  if (!["RATE_LIMIT", "PRODUCT_NOT_FOUND", "BAD_PHONE", "BAD_MODE", "OPTION_UNAVAILABLE", "INVALID_CUSTOMER"].some((code) => originalMessage.includes(code))) {
    e.message = SERVICE_ERROR;
  }
  return e;
}

function isTransient(error: unknown): boolean {
  const e = error as NeonError;
  return e?.status === 429 || e?.status === 500 || e?.status === 502 || e?.status === 503 ||
    e?.status === 504 || ["40001", "40P01", "53300", "57P01"].includes(e?.code ?? "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function neonQuery<R = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<NeonResult<R>> {
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await getSql().query(query, params) as { rows: R[]; rowCount?: number | null };
      return { rows: result.rows ?? [], rowCount: result.rowCount ?? result.rows?.length ?? 0, command: commandOf(query) };
    } catch (error) {
      if (attempt < 2 && isTransient(error)) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      throw normalizeError(error);
    }
  }
}

export async function neonExecute<R = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<NeonResult<R>> {
  try {
    const result = await getSql().query(query, params) as { rows: R[]; rowCount?: number | null };
    return { rows: result.rows ?? [], rowCount: result.rowCount ?? result.rows?.length ?? 0, command: commandOf(query) };
  } catch (error) {
    throw normalizeError(error);
  }
}

/** Clé anti-abus hachée : l'adresse IP n'est jamais conservée en clair. */
export async function clientKey(): Promise<string> {
  let ip = "";
  try {
    ip = (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip")?.trim() || "";
  } catch {
    ip = "";
  }
  let source = ip;
  if (!source) {
    let fallback = "unknown-client";
    try {
      fallback = `${getRequestHeader("user-agent") ?? "unknown"}|${getRequestHeader("accept-language") ?? "unknown"}`;
    } catch { /* no request context */ }
    source = `no-ip:${fallback}`;
  }
  return `${ip ? "ip" : "fallback"}:${crypto.createHash("sha256").update(source).digest("hex")}`;
}

/** Compteur atomique persistant. L'absence d'IP utilise une limite distincte et plus stricte. */
let lastRateLimitCleanup = 0;

export async function consumeRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (Date.now() - lastRateLimitCleanup > 60 * 60 * 1000) {
    await neonExecute("delete from rate_limits where updated_at < now() - interval '30 days'");
    lastRateLimitCleanup = Date.now();
  }
  const { rows } = await neonExecute<{ allowed: boolean }>(
    `insert into rate_limits (scope, key_hash, window_started_at, hits)
     values ($1, $2, now(), 1)
     on conflict (scope, key_hash) do update set
       hits = case when rate_limits.window_started_at < now() - ($4 * interval '1 second') then 1 else rate_limits.hits + 1 end,
       window_started_at = case when rate_limits.window_started_at < now() - ($4 * interval '1 second') then now() else rate_limits.window_started_at end,
       updated_at = now()
     returning (hits <= $3) as allowed`,
    [scope, key, limit, windowSeconds],
  );
  return rows[0]?.allowed === true;
}
````


## `src/lib/admin.functions.ts`

````typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  handleAdminCheckAuth,
  handleAdminDeleteHomeImage,
  handleAdminDeleteOrder,
  handleAdminDeletePhotoFile,
  handleAdminDeleteProduct,
  handleAdminDuplicateProduct,
  handleAdminGetHomeImages,
  handleAdminGetOrders,
  handleAdminGetProducts,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminReorderHomeImages,
  handleAdminSaveHomeImage,
  handleAdminSaveProduct,
  handleAdminToggleProductActive,
  handleAdminUpdateOrderNotes,
  handleAdminUpdateOrderPayment,
  handleAdminUpdateOrderStatus,
  handleAdminUpdateSettings,
} from "./admin.server";
import type {
  CategoryKey,
  HomeImage,
  Order,
  OrderStatus,
  PaymentReceived,
  Product,
  Settings,
} from "./types";

export const adminCheckAuth = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ authenticated: boolean; email?: string }> => handleAdminCheckAuth(),
);

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) =>
    z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminLogin(data));

export const adminLogout = createServerFn({ method: "POST" }).handler(async () =>
  handleAdminLogout(),
);

export const adminGetOrders = createServerFn({ method: "GET" })
  .validator((d?: { status?: string }) =>
    z.object({ status: z.string().optional() }).optional().parse(d),
  )
  .handler(async ({ data }) => handleAdminGetOrders(data?.status));

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; status: OrderStatus }) =>
    z
      .object({
        orderId: z.string(),
        status: z.enum(["nouvelle", "confirmee", "en_fabrication", "prete", "livree"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderStatus(data.orderId, data.status));

export const adminUpdateOrderPayment = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; paymentReceived: PaymentReceived }) =>
    z
      .object({
        orderId: z.string(),
        paymentReceived: z.enum(["non", "acompte", "total"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderPayment(data.orderId, data.paymentReceived));

export const adminUpdateOrderNotes = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; notes: string }) =>
    z.object({ orderId: z.string(), notes: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data }) => handleAdminUpdateOrderNotes(data.orderId, data.notes));

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .validator((d: { orderId: string }) => z.object({ orderId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteOrder(data.orderId));

export const adminGetProducts = createServerFn({ method: "GET" }).handler(async () =>
  handleAdminGetProducts(),
);

export const adminSaveProduct = createServerFn({ method: "POST" })
  .validator((d: Partial<Product> & { name: string; category: CategoryKey }) => d)
  .handler(async ({ data }) => handleAdminSaveProduct(data));

export const adminToggleProductActive = createServerFn({ method: "POST" })
  .validator((d: { productId: string; active: boolean }) =>
    z.object({ productId: z.string(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => handleAdminToggleProductActive(data.productId, data.active));

export const adminDuplicateProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDuplicateProduct(data.productId));

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator((d: { productId: string }) => z.object({ productId: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteProduct(data.productId));

export const adminGetHomeImages = createServerFn({ method: "GET" }).handler(async () =>
  handleAdminGetHomeImages(),
);

export const adminSaveHomeImage = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id?: string;
      url: string;
      caption?: string;
      kind: "hero" | "carousel" | "category" | "gallery";
      category_key?: "anime" | "marvel" | "dc" | "jeux" | "armes" | null;
      position?: number;
    }) => d,
  )
  .handler(async ({ data }) => handleAdminSaveHomeImage(data));

export const adminDeleteHomeImage = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeleteHomeImage(data.id));

export const adminReorderHomeImages = createServerFn({ method: "POST" })
  .validator((d: { items: { id: string; position: number }[] }) =>
    z
      .object({
        items: z.array(z.object({ id: z.string(), position: z.number() })),
      })
      .parse(d),
  )
  .handler(async ({ data }) => handleAdminReorderHomeImages(data.items));

export const adminDeletePhotoFile = createServerFn({ method: "POST" })
  .validator((d: { url: string }) => z.object({ url: z.string() }).parse(d))
  .handler(async ({ data }) => handleAdminDeletePhotoFile(data.url));

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .validator((d: Settings) => d)
  .handler(async ({ data }) => handleAdminUpdateSettings(data));
````


## `src/lib/data.functions.ts`

````typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clientKey, consumeRateLimit, neonExecute, neonQuery } from "./neon.server";
import { phoneKey, type HomeImage, type OrderStatus, type Product, type Settings } from "./types";

const PRODUCT_COLS =
  "id::text, slug, name, universe, category, description, images, base_price, weapon_price, accessories_price, weapon_only_price, accessories_only_price, production_days, urgent_days, featured, active";

const DEFAULT_SETTINGS: Settings = {
  whatsapp: "",
  instagram: "",
  tiktok: null,
  email: "",
  deposit_percent: null,
  urgent_fee_percent: null,
  delivery_zones: [],
  logo_text: "NDC COSPLAY",
  logo_url: null,
};

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Settings> => {
    const { rows } = await neonQuery<Settings>(
      "select whatsapp, instagram, tiktok, email, deposit_percent, urgent_fee_percent, delivery_zones, logo_text, logo_url from settings where id = 1",
    );
    const s = rows[0];
    if (!s) return DEFAULT_SETTINGS;
    return {
      ...s,
      tiktok: s.tiktok?.trim() || null,
      delivery_zones: Array.isArray(s.delivery_zones) ? s.delivery_zones : [],
      logo_text: s.logo_text || "NDC COSPLAY",
      logo_url: s.logo_url || null,
    };
  },
);

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { rows } = await neonQuery<Product>(
      `select ${PRODUCT_COLS} from products where active order by featured desc, name limit 500`,
    );
    return rows;
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<Product | null> => {
    const { rows } = await neonQuery<Product>(
      `select ${PRODUCT_COLS} from products where active and slug = $1 limit 1`,
      [data.slug],
    );
    return rows[0] ?? null;
  });

export const getHomeImages = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeImage[]> => {
    const { rows } = await neonQuery<HomeImage>(
      "select id::text, kind, category_key, url, caption, position from home_images order by position, created_at limit 200",
    );
    return rows;
  },
);

const phoneRe = /^(\+?221)?\s?7[05678]\s?\d{3}\s?\d{2}\s?\d{2}$/;
const orderSchema = z.object({
  product_id: z.string().min(1).max(100),
  mode: z.enum(["cosplay", "armes", "accessoires", "armes_accessoires"]),
  with_weapon: z.boolean(),
  with_accessories: z.boolean(),
  urgent: z.boolean(),
  gender: z.string().max(20).nullable(),
  size: z.string().max(10).nullable(),
  measurements: z.record(z.string().max(20), z.number().min(0).max(250)).nullable(),
  unsure_size: z.boolean(),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(phoneRe),
  address: z.string().trim().min(3).max(300),
  payment_preference: z.enum(["moitie", "totalite", "livraison"]),
  // Anti-spam : champ piège (doit rester vide) et temps de remplissage.
  website: z.string().max(200),
  elapsed_ms: z.number(),
});

export type CreateOrderResult =
  | { ok: true; order_number: string; total: number | null }
  | { ok: false; error: "rate_limit" | "invalid" | "unavailable" };

export const createOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    if (data.website || data.elapsed_ms < 3000) return { ok: false, error: "invalid" };
    const { website: _w, elapsed_ms: _e, ...payload } = data;
    try {
      const { rows } = await neonExecute<{ order_number: string; total: number | null }>(
        "select order_number, total from create_order($1::jsonb, $2)",
        [payload, await clientKey()],
      );
      const row = rows[0];
      if (!row) return { ok: false, error: "unavailable" };
      return {
        ok: true,
        order_number: row.order_number,
        total: row.total == null ? null : Number(row.total),
      };
    } catch (err: unknown) {
      console.error(err);
      const m =
        typeof err === "object" && err !== null && "neonMessage" in err
          ? String((err as { neonMessage: unknown }).neonMessage)
          : "";
      if (m.includes("RATE_LIMIT")) return { ok: false, error: "rate_limit" };
      if (/PRODUCT_NOT_FOUND|BAD_MODE|BAD_PHONE|OPTION_UNAVAILABLE|INVALID_CUSTOMER/.test(m)) return { ok: false, error: "invalid" };
      return { ok: false, error: "unavailable" };
    }
  });

export type TrackResult =
  | {
      ok: true;
      order_number: string;
      product_name: string;
      status: OrderStatus;
      created_at: string;
    }
  | { ok: false };

export const trackOrder = createServerFn({ method: "POST" })
  .validator((d: { number: string; phone: string }) =>
    z.object({ number: z.string().trim().max(20), phone: z.string().trim().max(25) }).parse(d),
  )
  .handler(async ({ data }): Promise<TrackResult> => {
    try {
      const key = await clientKey();
      const limit = key.startsWith("fallback:") ? 4 : 10;
      if (!(await consumeRateLimit("track-order", key, limit, 15 * 60))) return { ok: false };
      const digits = data.number.replace(/\\D/g, "");
      const phoneLookup = phoneKey(data.phone);
      if (!digits || phoneLookup.length !== 9) return { ok: false };
      const number = `NDC-${digits.padStart(4, "0")}`;
      const { rows } = await neonQuery<{
        order_number: string;
        product_name: string;
        status: OrderStatus;
        created_at: string;
      }>(
        "select order_number, product_name, status, to_json(created_at) as created_at from orders where order_number = $1 and phone_key = $2 limit 1",
        [number, phoneLookup],
      );
      const row = rows[0];
      return row ? { ok: true, ...row } : { ok: false };
    } catch (error) {
      console.error("Order tracking unavailable:", error);
      return { ok: false };
    }
  });
````


## `src/lib/blob-upload.client.ts`

````typescript
import { upload } from "@vercel/blob/client";
import { compressImageToWebP } from "./image-compress";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadCompressedPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Format refusé. Utilise une image JPEG, PNG ou WebP.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("La photo doit peser 5 Mo maximum.");
  }

  const compressed = await compressImageToWebP(file);
  const response = await fetch(compressed.dataBase64);
  const blob = await response.blob();
  if (blob.type !== "image/webp" || blob.size > MAX_BYTES) {
    throw new Error("Impossible de préparer la photo au format WebP.");
  }
  const safeName = `${crypto.randomUUID()}.webp`;
  const result = await upload(safeName, blob, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
    contentType: "image/webp",
    clientPayload: JSON.stringify({ contentType: "image/webp", size: blob.size }),
  });
  return result.url;
}
````


## `src/routes/api.blob-upload.ts`

````typescript
import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isUserAuthenticated } from "@/lib/admin.server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const Route = createFileRoute("/api/blob-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
          return new Response("Configuration BLOB_READ_WRITE_TOKEN manquante", { status: 503 });
        }
        try {
          const json = (await request.json()) as HandleUploadBody;
          const body = await handleUpload({
            body: json,
            request,
            token,
            onBeforeGenerateToken: async (_pathname, clientPayload) => {
              if (!(await isUserAuthenticated())) {
                throw new Error("Non autorisé");
              }
              let payload: { contentType?: string; size?: number } = {};
              try {
                payload = JSON.parse(clientPayload ?? "{}") as typeof payload;
              } catch {
                throw new Error("Métadonnées de photo invalides.");
              }
              if (!["image/jpeg", "image/png", "image/webp"].includes(payload.contentType ?? "") ||
                  !Number.isFinite(payload.size) ||
                  Number(payload.size) <= 0 ||
                  Number(payload.size) > MAX_IMAGE_BYTES) {
                throw new Error("Photo invalide : WebP de 5 Mo maximum requis.");
              }
              return {
                allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
                maximumSizeInBytes: MAX_IMAGE_BYTES,
                addRandomSuffix: true,
                tokenPayload: JSON.stringify({ admin: true }),
              };
            },
            onUploadCompleted: async () => {
              // L'URL du Blob est enregistrée dans products.images ou home_images par l'interface admin.
            },
          });
          return Response.json(body);
        } catch (error) {
          console.error("Blob upload error:", error);
          return new Response("Échec de l'envoi de la photo", { status: 400 });
        }
      },
    },
  },
});
````


## `src/routes/suivi.tsx`

````tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, CircleDashed, Loader2, PackageSearch } from "lucide-react";
import { trackOrder, type TrackResult } from "@/lib/data.functions";
import { ORDER_STATUSES } from "@/lib/types";
import { settingsQuery } from "@/lib/queries";

const TITLE = "Suivre ma commande | NDC COSPLAY";
const DESC =
  "Suivez l'avancement de votre cosplay sur mesure : nouvelle, confirmée, en fabrication, prête, livrée.";

export const Route = createFileRoute("/suivi")({
  validateSearch: z.object({ number: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: Suivi,
});

function Suivi() {
  const { number: initialNumber } = Route.useSearch();
  const [number, setNumber] = useState(initialNumber ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      setResult(await trackOrder({ data: { number, phone } }));
    } catch {
      setResult({ ok: false });
    } finally {
      setLoading(false);
    }
  };

  const statusIndex = result?.ok ? ORDER_STATUSES.findIndex((s) => s.key === result.status) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="font-jp text-sm tracking-[0.3em] text-sakura">追跡</p>
      <h1 className="font-display mt-1 text-5xl md:text-6xl">Suivre ma commande</h1>
      <p className="mt-3 text-muted-foreground">
        Entrez votre numéro de commande et le numéro de téléphone utilisé à la commande.
      </p>

      <form onSubmit={submit} className="manga-panel mt-8 space-y-4 bg-card p-6">
        <label className="block text-sm font-semibold">
          Numéro de commande
          <input
            className="field mt-1"
            placeholder="NDC-0001"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Téléphone
          <input
            className="field mt-1"
            type="tel"
            inputMode="tel"
            placeholder="77 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="btn-manga w-full justify-center">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PackageSearch className="h-5 w-5" />
          )}{" "}
          Voir le statut
        </button>
      </form>

      {result && !result.ok && (
        <div className="mt-6 border-2 border-destructive bg-destructive/10 p-4 text-sm">
          Aucune commande trouvée
        </div>
      )}

      {result?.ok && (
        <div className="manga-panel mt-6 bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Commande {result.order_number}
          </p>
          <p className="mt-1 font-bold">{result.product_name}</p>
          <ol className="mt-6 space-y-4">
            {ORDER_STATUSES.map((s, i) => {
              const done = i <= statusIndex;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
                  ) : (
                    <CircleDashed className="h-6 w-6 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={done ? "font-semibold" : "text-muted-foreground/60"}>
                    {s.label}
                  </span>
                  {i === statusIndex && (
                    <span className="ml-auto bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">
                      Actuel
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
````


## `src/test/setup.ts`

````typescript
import "@testing-library/jest-dom/vitest";

process.env.ADMIN_EMAIL ??= "admin@example.test";
process.env.ADMIN_PASSWORD ??= "test-only-password-123";
process.env.SESSION_SECRET ??= "test-only-session-secret-that-is-at-least-32-characters";

(globalThis as unknown as { __IS_TEST__?: boolean }).__IS_TEST__ = true;

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
````


## `src/test/etape2.test.ts`

````typescript
import { describe, expect, it } from "vitest";
import { computePrice, availableModes, type PriceableProduct } from "@/lib/pricing";
import { phoneKey } from "@/lib/types";

const product: PriceableProduct = {
  base_price: 40000,
  weapon_price: 5000,
  accessories_price: 3000,
  weapon_only_price: 12000,
  accessories_only_price: 8000,
  urgent_days: 5,
};

describe("Calculs de prix et validation de téléphone", () => {
  it("calcule le prix du cosplay et des options côté serveur", () => {
    expect(computePrice(product, {
      mode: "cosplay", withWeapon: true, withAccessories: true, urgent: false,
    }, null)).toBe(48000);
  });

  it("renvoie null lorsque le prix de base n'est pas renseigné", () => {
    expect(computePrice({ ...product, base_price: null }, {
      mode: "cosplay", withWeapon: false, withAccessories: false, urgent: false,
    }, null)).toBeNull();
  });

  it("expose uniquement les formules tarifées", () => {
    expect(availableModes(product)).toEqual(["cosplay", "armes", "accessoires", "armes_accessoires"]);
    expect(availableModes({ ...product, weapon_only_price: null })).not.toContain("armes");
  });

  it("normalise un téléphone sénégalais vers ses neuf derniers chiffres", () => {
    expect(phoneKey("+221 77 123 45 67")).toBe("771234567");
  });
});
````


## `src/test/etape3.test.ts`

````typescript
import { describe, expect, it } from "vitest";
import { computePrice } from "@/lib/pricing";
import { phoneKey } from "@/lib/types";

describe("Régressions critiques", () => {
  it("applique le supplément urgent uniquement quand le produit le permet", () => {
    const product = {
      base_price: 50000,
      weapon_price: null,
      accessories_price: null,
      weapon_only_price: null,
      accessories_only_price: null,
      urgent_days: 4,
    };
    expect(computePrice(product, {
      mode: "cosplay", withWeapon: true, withAccessories: true, urgent: true,
    }, 10)).toBe(55000);
    expect(computePrice({ ...product, urgent_days: null }, {
      mode: "cosplay", withWeapon: false, withAccessories: false, urgent: true,
    }, 10)).toBe(50000);
  });

  it("ne considère pas deux formats de téléphone différents comme deux numéros", () => {
    expect(phoneKey("77 123 45 67")).toBe(phoneKey("+221771234567"));
  });
});
````


## `src/test/database.integration.test.ts`

````typescript
import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe("Intégration Neon (optionnelle)", () => {
  it.skipIf(!testDatabaseUrl)("se connecte à la base de test configurée", async () => {
    const sql = neon(testDatabaseUrl!);
    const result = await sql.query("select 1 as ok", []) as { rows: { ok: number }[] };
    expect(Number(result.rows[0]?.ok)).toBe(1);
  });
});
````


## `RAPPORT_AUDIT.md`

````markdown
# Rapport d'audit — NDC COSPLAY

## Corrections appliquées

- Suppression des valeurs par défaut des identifiants/secrets d'administration ; contrôle des longueurs minimales et comparaison constante.
- Suppression de la base en mémoire et de la passerelle Lovable ; accès SQL direct via `@neondatabase/serverless` et `DATABASE_URL`.
- Deux retries maximum sur les lectures uniquement lorsqu'une erreur est transitoire ; aucune répétition automatique des écritures.
- Erreurs de base de données traduites par le message français demandé.
- Schéma Neon idempotent, sans données de démonstration ni GRANT/policies Supabase ; paramètres initiaux vides.
- Téléversement navigateur direct vers Vercel Blob après compression WebP (1600 px max), token limité aux images et à 5 Mo.
- Suppression du stockage local des photos ; suppression Blob via le SDK ; SQL de nettoyage des anciennes URL `/uploads/`.
- Limitation anti-abus persistée dans `rate_limits`, clé IP hachée et clé de repli distincte à limite plus basse.
- Limitation du suivi de commande et message neutre `Aucune commande trouvée`.
- Cookie de session `HttpOnly`, `SameSite=Lax` et `Secure` en production.
- Mise à jour de la documentation, des variables d'environnement et de la configuration Vercel.

## Variables d'environnement requises

Configurer ces cinq variables côté serveur, dans `.env` local et dans Vercel (Preview/Production selon l'environnement) :

| Variable | Rôle |
|---|---|
| `ADMIN_EMAIL` | E-mail administrateur |
| `ADMIN_PASSWORD` | Mot de passe administrateur — 12 caractères minimum |
| `SESSION_SECRET` | Secret de signature — 32 caractères minimum |
| `DATABASE_URL` | Chaîne de connexion Neon PostgreSQL |
| `BLOB_READ_WRITE_TOKEN` | Jeton d'écriture du store Vercel Blob |

Générer un secret sans le mettre dans le dépôt :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Ne jamais ajouter `VITE_` devant ces variables privées. Ne pas envoyer leurs valeurs dans le chat et ne pas commiter `.env`.

## Installation, tests et build

À exécuter à la racine du projet :

```bash
npm install
npm run test
npm run lint
npm run build
```

Le test d'intégration Neon est ignoré si `TEST_DATABASE_URL` n'est pas défini. Pour l'activer, définir `TEST_DATABASE_URL` vers une base de test distincte, jamais vers la base de production.

**Limite de vérification :** l'installation des dépendances a expiré deux fois dans l'environnement d'exécution de cette session. Le build Vite, les tests Vitest et le lint n'ont donc pas pu être exécutés ici. Il faut les lancer localement/CI avant de considérer le déploiement validé. Aucun accès à votre vraie base Neon ni à votre store Blob n'était disponible pour tester les opérations réelles.

## Initialisation Neon

1. Ouvrir le SQL Editor de Neon.
2. Copier et exécuter tout le contenu de `schema.sql`.
3. Vérifier que les tables `settings`, `products`, `home_images`, `orders` et `rate_limits` existent.
4. Compléter les coordonnées de la boutique dans l'administration une fois le site configuré.

Vérification rapide :

```sql
select * from public.settings;
select * from public.products;
select * from public.home_images;
select * from public.orders;
select * from public.rate_limits;
```

Les tables ne reçoivent aucun produit de démonstration. La ligne initiale `settings` contient des valeurs de contact vides.

### Nettoyage des anciennes références photo

Si l'ancienne version a enregistré des URL locales `/uploads/`, exécuter le contenu de `cleanup_legacy_uploads.sql` dans Neon. Cette opération retire ces URL des tableaux `products.images` et supprime les lignes `home_images` correspondantes. Les anciennes images de test ont été supprimées du dossier `public/uploads/` dans l'archive corrigée.

## Vérifications manuelles avant mise en production

1. **Secrets absents :** dans un environnement temporaire sans `ADMIN_EMAIL`, `ADMIN_PASSWORD` ou `SESSION_SECRET`, tenter la connexion admin. L'accès doit être refusé avec un message de configuration explicite.
2. **Sécurité du mot de passe :** vérifier qu'un mot de passe de moins de 12 caractères ou un secret de moins de 32 caractères est refusé.
3. **Blocage admin :** effectuer 5 tentatives erronées depuis la même IP ; la connexion doit être bloquée pendant 15 minutes.
4. **Commandes :** envoyer une commande valide, vérifier le numéro `NDC-XXXX`, puis confirmer sa présence avec `select * from public.orders;`.
5. **Persistance :** redéployer après une commande et vérifier qu'elle est toujours présente.
6. **Photos :** charger une image JPEG/PNG/WebP de moins de 5 Mo, vérifier que l'URL est une URL Vercel Blob, supprimer la photo et confirmer sa disparition du store. Re-déployer et confirmer que les photos encore référencées s'affichent.
7. **Fichiers refusés :** tenter un SVG, un autre type MIME ou un fichier de plus de 5 Mo ; le téléversement doit être refusé.
8. **Suivi :** faire 10 tentatives de suivi en 15 minutes depuis la même IP ; les suivantes doivent être limitées. Une commande absente et des informations erronées doivent produire exactement `Aucune commande trouvée`.
9. **Anti-spam commandes :** envoyer plus de 5 commandes depuis la même IP en 10 minutes ; les suivantes doivent être refusées. Le champ piège et le délai minimal restent actifs.
10. **Cookies :** en production, inspecter le cookie `ndc_admin_session` et vérifier `Secure`, `HttpOnly`, `SameSite=Lax`.
11. **Logs :** vérifier qu'une panne Neon affiche le message de service indisponible et ne retourne jamais un faux succès.

## Déploiement Vercel

1. Pousser le dépôt sur GitHub puis l'importer dans Vercel.
2. Créer un store Blob dans Vercel et configurer `BLOB_READ_WRITE_TOKEN`.
3. Ajouter les cinq variables privées dans les réglages du projet.
4. Exécuter `schema.sql` dans Neon avant d'ouvrir le site aux commandes.
5. Lancer un Preview Deployment et effectuer les tests manuels ci-dessus.
6. Après validation, déployer en Production.

Le fichier `vercel.json` déclare le framework `tanstack-start`. La configuration Vite demande le preset Vercel à Nitro ; ce point doit être confirmé par un build effectif, qui n'a pas pu être exécuté dans cette session.
````


## `src/routes/admin.tsx` — extraits photo uniquement

Import ajouté :

```tsx
import { uploadCompressedPhoto } from "@/lib/blob-upload.client";
```

L'import `adminUploadPhoto` a été retiré de l'import groupé de `@/lib/admin.functions`.


### `ProductEditModal.handleUpload`

```tsx
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const url = await uploadCompressedPhoto(file);
        uploadedUrls.push(url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);
    } catch {
      toast.error("Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
```


### `UploadButton`

```tsx
function UploadButton({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (url: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCompressedPhoto(file);
      await onUploaded(url);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="btn-manga !px-3 !py-1.5 text-xs"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
```


## Fichiers supprimés

- `metadata.json`
- `public/uploads/` et ses 33 images de test/locales
