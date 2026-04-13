-- Migration: Thêm cột thanh toán QR Code ngân hàng
-- Created: 2026-04-14

-- ============================================================
-- CỘT MỚI BẢNG: orders
-- ============================================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text null;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status text not null default 'UNPAID';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS qr_code_url text null;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bank_transfer_reference text null;

-- Indexes
create index if not exists orders_payment_method_idx on public.orders (payment_method);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

-- ============================================================
-- RLS POLICY: User có thể đọc payment_status của đơn mình
-- ============================================================
-- Policy "Users can see their own orders" đã tồn tại — payment_status nằm trong
-- orders nên user đã có quyền đọc qua policy cũ. Không cần policy mới.
