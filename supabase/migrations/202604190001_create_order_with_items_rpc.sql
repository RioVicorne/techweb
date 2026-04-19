-- Create transactional RPC for order + order_items creation
create or replace function public.create_order_with_items(
  p_order_code text,
  p_user_id uuid,
  p_status text,
  p_currency text,
  p_subtotal int,
  p_shipping_fee int,
  p_discount int,
  p_total int,
  p_full_name text,
  p_phone text,
  p_address_line text,
  p_city text,
  p_email text,
  p_note text,
  p_delivery_method text,
  p_payment_method text,
  p_payment_status text,
  p_qr_code_url text,
  p_items jsonb
)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items must be a non-empty array';
  end if;

  insert into public.orders (
    order_code,
    user_id,
    status,
    currency,
    subtotal,
    shipping_fee,
    discount,
    total,
    full_name,
    phone,
    address_line,
    city,
    email,
    note,
    delivery_method,
    payment_method,
    payment_status,
    qr_code_url
  )
  values (
    p_order_code,
    p_user_id,
    p_status,
    p_currency,
    p_subtotal,
    p_shipping_fee,
    p_discount,
    p_total,
    p_full_name,
    p_phone,
    p_address_line,
    p_city,
    p_email,
    p_note,
    p_delivery_method,
    p_payment_method,
    p_payment_status,
    p_qr_code_url
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    variant_name_snapshot,
    sku_snapshot,
    image_url_snapshot,
    unit_price,
    qty,
    line_total
  )
  select
    v_order_id,
    item.product_id,
    item.variant_id,
    item.product_name_snapshot,
    item.variant_name_snapshot,
    item.sku_snapshot,
    item.image_url_snapshot,
    item.unit_price,
    item.qty,
    item.line_total
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    variant_id bigint,
    product_name_snapshot text,
    variant_name_snapshot text,
    sku_snapshot text,
    image_url_snapshot text,
    unit_price int,
    qty int,
    line_total int
  );

  return p_order_code;
end;
$$;
