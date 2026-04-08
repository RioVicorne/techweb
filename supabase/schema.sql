-- RioShop orders schema (minimal)

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  customer jsonb not null,
  lines jsonb not null,
  subtotal_vnd bigint not null,
  shipping_vnd bigint not null,
  total_vnd bigint not null,
  status text not null default 'created', -- created | paid | cancelled
  payment_provider text,
  payment_status text, -- unpaid | paid | failed
  stripe_session_id text
);

alter table public.orders enable row level security;

-- Deny by default for anon/authenticated (server uses service role).
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
end $$;

