-- Migration to add email and make phone/city nullable
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS email text null;

ALTER TABLE public.orders
ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.orders
ALTER COLUMN city DROP NOT NULL;

-- (Optional) If you want to migrate existing emails from grid_code to email:
-- UPDATE public.orders SET email = grid_code WHERE grid_code IS NOT NULL AND grid_code LIKE '%@%';
