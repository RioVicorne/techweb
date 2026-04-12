-- RioShop Supabase schema – Source of Truth (đồng bộ với cloud)
-- Cập nhật lần cuối: 2026-04-12

create extension if not exists pgcrypto;

-- ============================================================
-- BẢNG: profiles
-- Mở rộng thông tin Supabase Auth user
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text null,
  phone text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- BẢNG: categories
-- Danh mục sản phẩm (hỗ trợ phân cấp cha-con)
-- ============================================================
create table if not exists public.categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  parent_id bigint null references public.categories (id),
  sort_order int null default 0,
  is_active boolean null default true
);

alter table public.categories enable row level security;
create policy "Public can read active categories" on public.categories for select using (is_active = true);

-- ============================================================
-- BẢNG: products
-- Sản phẩm chính (1 sản phẩm có nhiều variants)
-- ============================================================
create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text null,
  brand text null,
  status text not null default 'ACTIVE',
  default_variant_id bigint null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
create policy "Public can read active products" on public.products for select using (status = 'ACTIVE');

-- ============================================================
-- BẢNG: product_categories (many-to-many)
-- ============================================================
create table if not exists public.product_categories (
  product_id bigint not null references public.products (id) on delete cascade,
  category_id bigint not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

alter table public.product_categories enable row level security;
create policy "Public can read product categories" on public.product_categories for select using (true);

-- ============================================================
-- BẢNG: product_variants
-- Biến thể sản phẩm (giá, SKU, thuộc tính)
-- ============================================================
create table if not exists public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  name text null,
  sku text not null unique,
  price int not null,
  compare_at_price int null,
  attributes jsonb null,
  is_active boolean null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.product_variants enable row level security;
create policy "Public can read active variants" on public.product_variants for select using (is_active = true);

-- ============================================================
-- BẢNG: product_images
-- ============================================================
create table if not exists public.product_images (
  id bigserial primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  variant_id bigint null references public.product_variants (id) on delete set null,
  url text not null,
  alt text null,
  sort_order int null default 0
);

alter table public.product_images enable row level security;
create policy "Public can read product images" on public.product_images for select using (true);

-- ============================================================
-- BẢNG: inventory
-- Tồn kho theo variant
-- ============================================================
create table if not exists public.inventory (
  variant_id bigint primary key references public.product_variants (id) on delete cascade,
  quantity_on_hand int not null default 0,
  reserved int not null default 0,
  updated_at timestamptz default now()
);

alter table public.inventory enable row level security;
create policy "Public can read inventory" on public.inventory for select using (true);

-- ============================================================
-- BẢNG: orders
-- Đơn hàng chính
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),

  order_code text not null unique,
  user_id uuid null references auth.users (id) on delete set null,

  status text not null default 'PENDING_PAYMENT',
  currency text not null default 'VND',

  subtotal int not null default 0,
  shipping_fee int not null default 0,
  discount int not null default 0,
  total int not null default 0,

  full_name text not null,
  phone text null,
  address_line text not null,
  city text null,
  email text null,

  -- Dự phòng, không còn dùng để lưu email
  grid_code text null,
  note text null,

  delivery_method text not null default 'STANDARD',

  -- Thanh toán
  payment_provider text null,
  stripe_session_id text null
);

create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index if not exists orders_order_code_idx on public.orders (order_code);

alter table public.orders enable row level security;
create policy "Users can see their own orders"   on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert their own orders" on public.orders for insert with check (auth.uid() = user_id);

-- ============================================================
-- BẢNG: order_items
-- Chi tiết từng sản phẩm trong đơn hàng (dùng snapshot)
-- ============================================================
create table if not exists public.order_items (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  order_id uuid not null references public.orders (id) on delete cascade,

  -- FK về products/variants nếu còn tồn tại (nullable để snapshot an toàn)
  product_id bigint null references public.products (id) on delete set null,
  variant_id bigint null references public.product_variants (id) on delete set null,

  -- Snapshot tại thời điểm đặt hàng (bất biến)
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  sku_snapshot text not null,
  image_url_snapshot text null,

  unit_price int not null default 0,
  qty int not null default 1 check (qty > 0),
  line_total int not null default 0
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

-- ============================================================
-- BẢNG: payments
-- Lưu thông tin giao dịch Stripe / MoMo
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'MOMO',
  provider_order_id text not null unique,
  provider_request_id text not null unique,
  amount int not null,
  status text not null default 'INIT',
  pay_url text null,
  deeplink text null,
  qr_code_url text null,
  request_payload jsonb null,
  return_payload jsonb null,
  ipn_payload jsonb null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;
