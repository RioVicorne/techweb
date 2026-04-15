-- Migration: Nâng cấp bảng profiles để lưu hồ sơ + địa chỉ giao hàng mặc định
-- Created: 2026-04-15

alter table public.profiles
  add column if not exists email text null,
  add column if not exists avatar_url text null,
  add column if not exists birthday date null,
  add column if not exists shipping_address jsonb not null default '{}'::jsonb,
  add column if not exists address_line text null,
  add column if not exists ward text null,
  add column if not exists district text null,
  add column if not exists city text null,
  add column if not exists province text null,
  add column if not exists postal_code text null,
  add column if not exists country_code text not null default 'VN',
  add column if not exists last_seen_at timestamptz null;

update public.profiles
set shipping_address = '{}'::jsonb
where shipping_address is null;

update public.profiles
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where created_at is null or updated_at is null;

alter table public.profiles
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column shipping_address set default '{}'::jsonb,
  alter column shipping_address set not null,
  alter column country_code set default 'VN',
  alter column country_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_shipping_address_object_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_shipping_address_object_chk
      check (jsonb_typeof(shipping_address) = 'object');
  end if;
end;
$$;

create index if not exists profiles_email_idx
  on public.profiles (lower(email))
  where email is not null;

create index if not exists profiles_phone_idx
  on public.profiles (phone)
  where phone is not null;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;
end;
$$;

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

update public.profiles p
set
  email = coalesce(p.email, u.email),
  full_name = coalesce(
    nullif(p.full_name, ''),
    nullif(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), '')
  ),
  phone = coalesce(
    nullif(p.phone, ''),
    nullif(coalesce(u.raw_user_meta_data ->> 'phone', ''), '')
  ),
  shipping_address = case
    when p.shipping_address is null or p.shipping_address = '{}'::jsonb then
      case
        when jsonb_typeof(u.raw_user_meta_data -> 'shipping_address') = 'object'
          then u.raw_user_meta_data -> 'shipping_address'
        else '{}'::jsonb
      end
    else p.shipping_address
  end,
  updated_at = now()
from auth.users u
where p.id = u.id;
