-- RioShop Supabase schema – Source of Truth (đồng bộ với cloud)
-- Cập nhật lần cuối: 2026-04-12

create extension if not exists pgcrypto;

-- ============================================================
-- BẢNG: profiles
-- Hồ sơ người dùng + thông tin giao hàng mặc định
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text null,
  phone text null,
  email text null,
  avatar_url text null,
  birthday date null,
  shipping_address jsonb not null default '{}'::jsonb,
  address_line text null,
  ward text null,
  district text null,
  city text null,
  province text null,
  postal_code text null,
  country_code text not null default 'VN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  constraint profiles_shipping_address_object_chk
    check (jsonb_typeof(shipping_address) = 'object')
);

create index if not exists profiles_email_idx on public.profiles (lower(email)) where email is not null;
create index if not exists profiles_phone_idx on public.profiles (phone) where phone is not null;

alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  raw_meta jsonb;
  raw_shipping jsonb;
begin
  raw_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_shipping := coalesce(raw_meta -> 'shipping_address', '{}'::jsonb);

  insert into public.profiles (
    id,
    full_name,
    phone,
    email,
    shipping_address,
    created_at,
    updated_at
  )
  values (
    new.id,
    nullif(coalesce(raw_meta ->> 'full_name', raw_meta ->> 'name', ''), ''),
    nullif(coalesce(raw_meta ->> 'phone', ''), ''),
    new.email,
    case
      when jsonb_typeof(raw_shipping) = 'object' then raw_shipping
      else '{}'::jsonb
    end,
    now(),
    now()
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = coalesce(excluded.email, public.profiles.email),
    shipping_address = case
      when public.profiles.shipping_address is null or public.profiles.shipping_address = '{}'::jsonb
        then excluded.shipping_address
      else public.profiles.shipping_address
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

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

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

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

create index if not exists product_images_product_id_idx on public.product_images (product_id);

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
  currency text not null default 'đ',

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

-- ============================================================
-- BẢNG: product_reviews
-- Đánh giá sản phẩm từ khách hàng
-- ============================================================
create table if not exists public.product_reviews (
  id bigserial primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  user_id uuid null references auth.users (id) on delete set null,

  -- Thông tin review
  rating int not null check (rating >= 1 and rating <= 5),
  title text null,
  comment text not null,

  -- Thông tin người review (snapshot để giữ nguyên khi user đổi tên)
  reviewer_name text not null,
  reviewer_email text null,

  -- Trạng thái
  is_verified_purchase boolean null default false,
  is_approved boolean null default false,
  status text not null default 'PENDING', -- PENDING, APPROVED, REJECTED

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);
create index if not exists product_reviews_user_id_idx on public.product_reviews (user_id);
create index if not exists product_reviews_status_idx on public.product_reviews (status);
create index if not exists product_reviews_rating_idx on public.product_reviews (rating);

alter table public.product_reviews enable row level security;

-- Public có thể đọc reviews đã được duyệt
create policy "Public can read approved reviews" on public.product_reviews
  for select
  using (status = 'APPROVED');

-- User có thể tạo review (cần đăng nhập hoặc guest)
create policy "Anyone can create reviews" on public.product_reviews
  for insert
  with check (true);

-- User chỉ được sửa review của mình
create policy "Users can update own reviews" on public.product_reviews
  for update
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: Tính trung bình rating cho sản phẩm
-- ============================================================
create or replace function public.get_product_rating_stats(p_product_id bigint)
returns table (
  average_rating numeric,
  total_reviews bigint,
  rating_1 bigint,
  rating_2 bigint,
  rating_3 bigint,
  rating_4 bigint,
  rating_5 bigint
)
language sql
stable
as $$
  select
    coalesce(avg(rating), 0) as average_rating,
    count(*) as total_reviews,
    count(*) filter (where rating = 1) as rating_1,
    count(*) filter (where rating = 2) as rating_2,
    count(*) filter (where rating = 3) as rating_3,
    count(*) filter (where rating = 4) as rating_4,
    count(*) filter (where rating = 5) as rating_5
  from public.product_reviews
  where product_id = p_product_id and status = 'APPROVED'
$$;

