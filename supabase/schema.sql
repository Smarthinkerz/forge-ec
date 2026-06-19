-- supabase/schema.sql
-- ForgeEC multi-tenant schema. Every business table is scoped to an organization
-- and protected by RLS: a user sees a row only if they're a member of its org.

-- ── Profiles (mirror of auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ── Organizations + memberships ─────────────────────────────────────────────
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  plan        text not null default 'free' check (plan in ('free','starter','growth','enterprise')),
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'viewer' check (role in ('owner','admin','editor','analyst','viewer')),
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Helper: orgs the current user belongs to.
create or replace function public.my_org_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select org_id from public.memberships where user_id = auth.uid()
$$;

-- ── Stores ───────────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  platform     text not null check (platform in ('shopify','woocommerce','bigcommerce','magento','custom')),
  name         text not null,
  domain       text,
  status       text not null default 'connected' check (status in ('connected','syncing','error','disconnected')),
  credentials_enc text,            -- AES-256-GCM blob; decryptable only with CREDENTIALS_ENCRYPTION_KEY
  last_synced_at  timestamptz,
  connected_at timestamptz not null default now()
);

-- ── Products ──────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  external_id text,
  title       text not null,
  price       numeric,
  currency    text default 'USD',
  image_url   text,
  updated_at  timestamptz not null default now()
);

-- ── Channels (ad platform connections) ───────────────────────────────────────
create table if not exists public.channels (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  platform     text not null check (platform in ('google','meta','tiktok','pinterest','microsoft','youtube','amazon','snapchat')),
  account_name text,
  status       text not null default 'connected' check (status in ('connected','error','disconnected')),
  created_at   timestamptz not null default now()
);

-- ── Campaigns ──────────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  channel_id   uuid references public.channels(id) on delete set null,
  name         text not null,
  objective    text not null default 'conversions',
  status       text not null default 'draft' check (status in ('draft','active','paused','ended')),
  budget_daily numeric not null default 0,
  currency     text not null default 'USD',
  created_at   timestamptz not null default now()
);

-- ── Creatives ─────────────────────────────────────────────────────────────────
create table if not exists public.creatives (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  type        text not null default 'static' check (type in ('static','carousel','video','ugc')),
  headline    text,
  body        text,
  asset_url   text,
  status      text not null default 'draft' check (status in ('draft','testing','live','archived')),
  created_at  timestamptz not null default now()
);

-- ── Metrics (daily time-series) ─────────────────────────────────────────────────
-- For very high volume, convert to a TimescaleDB hypertable later (out of scope here).
create table if not exists public.metrics_daily (
  id          bigserial primary key,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  date        date not null,
  spend       numeric not null default 0,
  revenue     numeric not null default 0,
  impressions bigint not null default 0,
  clicks      bigint not null default 0,
  conversions bigint not null default 0
);
create index if not exists metrics_daily_org_date_idx on public.metrics_daily(org_id, date);

-- ── Audit log ────────────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          bigserial primary key,
  org_id      uuid references public.organizations(id) on delete set null,
  actor       uuid,
  action      text not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

-- ── Feature flags ──────────────────────────────────────────────────────────────
create table if not exists public.feature_flags (
  key text primary key, enabled boolean not null default false, description text,
  updated_at timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.stores        enable row level security;
alter table public.products      enable row level security;
alter table public.channels      enable row level security;
alter table public.campaigns     enable row level security;
alter table public.creatives     enable row level security;
alter table public.metrics_daily enable row level security;
alter table public.feature_flags enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "member orgs" on public.organizations;
create policy "member orgs" on public.organizations for select using (id in (select public.my_org_ids()));
drop policy if exists "own memberships" on public.memberships;
create policy "own memberships" on public.memberships for select using (user_id = auth.uid() or org_id in (select public.my_org_ids()));

-- Org-scoped tables: access iff the row's org is one of mine.
drop policy if exists "org stores" on public.stores;
create policy "org stores"     on public.stores        for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "org products" on public.products;
create policy "org products"   on public.products      for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "org channels" on public.channels;
create policy "org channels"   on public.channels      for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "org campaigns" on public.campaigns;
create policy "org campaigns"  on public.campaigns     for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "org creatives" on public.creatives;
create policy "org creatives"  on public.creatives     for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "org metrics" on public.metrics_daily;
create policy "org metrics"    on public.metrics_daily for all using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));
drop policy if exists "read flags" on public.feature_flags;
create policy "read flags"     on public.feature_flags for select using (true);

-- ── New-user trigger: profile + personal org + owner membership ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  insert into public.organizations (name, slug)
  values (coalesce(new.raw_user_meta_data->>'org_name', 'My Organization'),
          'org-' || substr(new.id::text, 1, 8))
  returning id into new_org;

  insert into public.memberships (org_id, user_id, role) values (new_org, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Touchpoints (multi-touch attribution source) ─────────────────────────────
-- One row per (conversion, touchpoint). Grouped by conversion_id to form a
-- customer journey. Populated by server-side tracking (/api/track).
create table if not exists public.touchpoints (
  id             bigserial primary key,
  org_id         uuid not null references public.organizations(id) on delete cascade,
  conversion_id  uuid not null,
  channel        text not null,
  days_before    integer not null default 0,
  revenue        numeric not null default 0,
  converted      boolean not null default true,
  occurred_at    timestamptz not null default now()
);
create index if not exists touchpoints_org_conv_idx on public.touchpoints(org_id, conversion_id);
alter table public.touchpoints enable row level security;
drop policy if exists "org touchpoints" on public.touchpoints;
create policy "org touchpoints" on public.touchpoints for all
  using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));

-- ── API keys (public API auth) ───────────────────────────────────────────────
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text,
  prefix       text not null,         -- shown in UI (e.g. "fec_live_ab12")
  key_hash     text not null,         -- sha256 of the full key; raw key never stored
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists api_keys_hash_idx on public.api_keys(key_hash);
alter table public.api_keys enable row level security;
drop policy if exists "org api keys" on public.api_keys;
create policy "org api keys" on public.api_keys for all
  using (org_id in (select public.my_org_ids())) with check (org_id in (select public.my_org_ids()));

-- ── White-label branding ──────────────────────────────────────────────────────
alter table public.organizations add column if not exists brand_name text;
alter table public.organizations add column if not exists brand_accent text;

-- ── Billing: orders + webhook idempotency (added with Tap checkout) ──
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  plan            text not null,
  tap_charge_id   text,
  amount          numeric not null default 0,
  currency        text not null default 'USD',
  status          text not null default 'initiated'
                  check (status in ('initiated','paid','failed','cancelled','refunded','partially_refunded','refunding')),
  customer_email  text,
  reference_order text,
  reference_txn   text,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);
create index if not exists orders_org_idx on public.orders(org_id);
create index if not exists orders_charge_idx on public.orders(tap_charge_id);
alter table public.orders enable row level security;
drop policy if exists "org orders" on public.orders;
create policy "org orders" on public.orders for select using (org_id in (select public.my_org_ids()));

-- Service-role-only table (no user policies): dedups inbound webhook events.
create table if not exists public.processed_webhook_events (
  event_key   text primary key,
  created_at  timestamptz not null default now()
);
alter table public.processed_webhook_events enable row level security;
