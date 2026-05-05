-- ============================================
-- Mechanics module: mechanic accounts, job assignment,
-- before/after photos, cash collection, commissions.
-- ============================================

-- Mechanic accounts. Login = phone + 4-digit PIN.
-- session_token rotates on each login; null means logged out.
create table if not exists public.mechanics (
  id text primary key,
  full_name text not null,
  phone text not null unique,
  pin text not null check (char_length(pin) between 4 and 6),
  active boolean not null default true,
  availability text not null default 'off' check (availability in ('available','busy','off')),
  commission_rate numeric not null default 0.10,
  session_token text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mechanics_phone_idx on public.mechanics(phone);
create index if not exists mechanics_session_idx on public.mechanics(session_token);
create index if not exists mechanics_active_idx on public.mechanics(active);

-- Extend bookings with mechanic-flow fields.
alter table public.bookings
  add column if not exists assigned_mechanic_id text references public.mechanics(id) on delete set null,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cash_collected numeric,
  add column if not exists payment_method text check (payment_method in ('cash','transfer','pending')),
  add column if not exists mechanic_notes text,
  add column if not exists before_photos text[] not null default '{}',
  add column if not exists after_photos text[] not null default '{}',
  add column if not exists source text not null default 'website' check (source in ('website','phone','walk_in'));

create index if not exists bookings_mechanic_idx on public.bookings(assigned_mechanic_id);
create index if not exists bookings_source_idx on public.bookings(source);

-- Commission payout history. One row per (mechanic, period) when admin records a payout.
create table if not exists public.commission_payouts (
  id bigserial primary key,
  mechanic_id text not null references public.mechanics(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_jobs int not null default 0,
  total_revenue numeric not null default 0,
  commission_amount numeric not null default 0,
  status text not null default 'paid' check (status in ('pending','paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists commission_payouts_mechanic_idx on public.commission_payouts(mechanic_id);
create index if not exists commission_payouts_period_idx on public.commission_payouts(period_start, period_end);

-- ============================================
-- Storage bucket for job photos.
-- Run this manually in Supabase SQL editor if the bucket isn't auto-created;
-- the dashboard "Storage" section is the easier path.
-- ============================================
-- insert into storage.buckets (id, name, public) values ('job-photos','job-photos',true)
--   on conflict (id) do nothing;
