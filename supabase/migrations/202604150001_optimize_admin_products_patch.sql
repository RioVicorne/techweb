-- Migration: Tối ưu truy vấn cho cập nhật sản phẩm admin
-- Created: 2026-04-15

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists product_images_product_id_idx
  on public.product_images (product_id);
