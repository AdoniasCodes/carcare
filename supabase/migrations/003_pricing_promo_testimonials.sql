-- ============================================
-- Pricing control — admin can set per-plan prices + discounts
-- ============================================
create table if not exists public.plan_pricing (
  plan text primary key check (plan in ('silver','gold','platinum')),
  base_price numeric not null,
  current_price numeric not null,
  discount_label text,    -- short badge, e.g. "Limited Time" / "May Special"
  discount_reason text,   -- explanation, e.g. "Save 500 ETB this month"
  updated_at timestamptz not null default now()
);

-- Seed defaults (idempotent)
insert into public.plan_pricing (plan, base_price, current_price)
values
  ('silver', 1500, 1500),
  ('gold', 2500, 2500),
  ('platinum', 4000, 4000)
on conflict (plan) do nothing;

-- ============================================
-- Promo codes
-- ============================================
create table if not exists public.promo_codes (
  id bigserial primary key,
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('amount','percent')),
  discount_value numeric not null,
  applies_to text not null default 'all' check (applies_to in ('all','subscription','booking','silver','gold','platinum')),
  max_uses int,
  uses_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists promo_codes_code_idx on public.promo_codes(code);
create index if not exists promo_codes_active_idx on public.promo_codes(active);

-- Add promo_code column to bookings + subscriptions
alter table public.bookings
  add column if not exists promo_code text,
  add column if not exists discount_applied numeric;

alter table public.subscriptions
  add column if not exists promo_code text,
  add column if not exists discount_applied numeric,
  add column if not exists final_price numeric;

-- ============================================
-- Video testimonials (admin pastes URLs, frontend embeds)
-- ============================================
create table if not exists public.video_testimonials (
  id bigserial primary key,
  platform text not null check (platform in ('tiktok','facebook','youtube')),
  video_url text not null,
  customer_name text,
  customer_car text,
  caption text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists video_testimonials_active_idx on public.video_testimonials(active);
create index if not exists video_testimonials_sort_idx on public.video_testimonials(sort_order);
