-- RioShop Supabase schema (orders + order_items)
-- Matches API routes in src/app/api/** and Account/Checkout clients.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Business identifier shown to user (e.g. "RS...").
  order_code text not null unique,

  -- Link to Supabase Auth user (nullable for guest checkout if you ever allow it).
  user_id uuid null references auth.users (id) on delete set null,

  status text not null default 'PENDING_PAYMENT',
  currency text not null default 'VND',

  subtotal bigint not null default 0,
  shipping_fee bigint not null default 0,
  discount bigint not null default 0,
  total bigint not null default 0,

  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null default '',

  -- App currently stores email in this nullable field.
  grid_code text null,
  note text null,

  delivery_method text not null default 'STANDARD',

  payment_provider text null,
  stripe_session_id text null
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_order_code_idx
  on public.orders (order_code);

create table if not exists public.order_items (
  id bigserial primary key,
  created_at timestamptz not null default now(),

  order_id uuid not null references public.orders (id) on delete cascade,

  product_id uuid null,
  variant_id uuid null,

  product_name_snapshot text null,
  variant_name_snapshot text null,
  sku_snapshot text null,
  image_url_snapshot text null,

  unit_price bigint not null default 0,
  qty int not null default 1,
  line_total bigint not null default 0
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Deny by default for anon/authenticated; server uses service role in API routes.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='deny_all_orders'
  ) then
    create policy deny_all_orders on public.orders
      for all
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='deny_all_order_items'
  ) then
    create policy deny_all_order_items on public.order_items
      for all
      using (false)
      with check (false);
  end if;
end $$;

