-- Migration: Thêm bảng product_reviews
-- Created: 2026-04-13

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
drop policy if exists "Public can read approved reviews" on public.product_reviews;
create policy "Public can read approved reviews" on public.product_reviews
  for select
  using (status = 'APPROVED');

-- User có thể tạo review (cần đăng nhập hoặc guest)
drop policy if exists "Anyone can create reviews" on public.product_reviews;
create policy "Anyone can create reviews" on public.product_reviews
  for insert
  with check (true);

-- User chỉ được sửa review của mình
drop policy if exists "Users can update own reviews" on public.product_reviews;
create policy "Users can update own reviews" on public.product_reviews
  for update
  using (auth.uid() = user_id);

-- Admin có thể quản lý tất cả reviews (dùng service role key bypass RLS)

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
