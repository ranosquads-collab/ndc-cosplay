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
