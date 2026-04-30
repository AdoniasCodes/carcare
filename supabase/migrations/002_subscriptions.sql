-- Subscriptions table — yearly preventive roadside assistance plans
-- Tiers: silver (1500 ETB), gold (2500 ETB), platinum (4000 ETB)

create table if not exists public.subscriptions (
  id text primary key,
  name text not null,
  phone text not null,
  email text,
  car_make text not null,
  car_model text not null,
  car_year text not null,
  plate_number text,
  plan text not null check (plan in ('silver','gold','platinum')),
  price numeric not null,
  location text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','partial','refunded')),
  start_date date,
  end_date date,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_plan_idx on public.subscriptions(plan);
create index if not exists subscriptions_end_date_idx on public.subscriptions(end_date);
create index if not exists subscriptions_created_at_idx on public.subscriptions(created_at desc);

-- Subscription calls log — track each emergency / preventive call against a sub
create table if not exists public.subscription_calls (
  id bigserial primary key,
  subscription_id text not null references public.subscriptions(id) on delete cascade,
  call_type text not null check (call_type in ('emergency','preventive_check','oil_change','other')),
  description text,
  cost numeric,
  created_at timestamptz not null default now()
);

create index if not exists subscription_calls_sub_idx on public.subscription_calls(subscription_id);
