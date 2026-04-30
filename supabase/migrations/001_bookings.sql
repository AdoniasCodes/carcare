-- Bookings table (existing — included here for reference / fresh setups)

create table if not exists public.bookings (
  id text primary key,
  name text not null,
  phone text not null,
  car_make text not null,
  car_model text not null,
  car_year text not null,
  service_type text not null check (service_type in ('preventative','routine','roadside','other')),
  description text,
  location text not null,
  preferred_date date not null,
  status text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  revenue numeric,
  cost numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_preferred_date_idx on public.bookings(preferred_date);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
