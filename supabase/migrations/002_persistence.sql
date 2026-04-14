-- Search History table
create table if not exists search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  origin text not null,
  destination text not null,
  departure_date date not null,
  cabin_class text,
  created_at timestamp with time zone default now()
);

-- Price Alerts table
create table if not exists price_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  origin text not null,
  destination text not null,
  target_price numeric not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Booking Logs table
create table if not exists booking_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  flight_id text not null,
  amount numeric,
  status text default 'confirmed',
  created_at timestamp with time zone default now()
);

-- Performance Indexes on foreign keys
create index if not exists idx_search_history_user_id on search_history (user_id);
create index if not exists idx_price_alerts_user_id on price_alerts (user_id);
create index if not exists idx_booking_logs_user_id on booking_logs (user_id);

-- Enable Row Level Security (RLS)
alter table search_history enable row level security;
alter table price_alerts enable row level security;
alter table booking_logs enable row level security;

-- Policies (Ensure users can only access their own data)
do $$ 
begin
  -- Search history policies
  if not exists (select from pg_policies where policyname = 'Users can manage their own searches' and tablename = 'search_history') then
    create policy "Users can manage their own searches" on search_history for all using (auth.uid() = user_id);
  end if;

  -- Price alerts policies
  if not exists (select from pg_policies where policyname = 'Users can manage their own alerts' and tablename = 'price_alerts') then
    create policy "Users can manage their own alerts" on price_alerts for all using (auth.uid() = user_id);
  end if;

  -- Booking logs policies
  if not exists (select from pg_policies where policyname = 'Users can manage their own bookings' and tablename = 'booking_logs') then
    create policy "Users can manage their own bookings" on booking_logs for all using (auth.uid() = user_id);
  end if;
end $$;
