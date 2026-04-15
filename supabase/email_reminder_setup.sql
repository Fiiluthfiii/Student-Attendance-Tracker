create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  gmail text not null,
  minutes_before integer not null default 30 check (minutes_before between 5 and 180),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id bigint,
  trigger_at timestamptz not null,
  sent_at timestamptz not null default now(),
  email_to text not null,
  status text not null default 'sent'
);

alter table public.reminder_logs
  add column if not exists schedule_name text;

alter table public.reminder_logs
  add column if not exists error_message text;

alter table public.reminder_settings enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "reminder settings own row select" on public.reminder_settings;
create policy "reminder settings own row select"
  on public.reminder_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "reminder settings own row upsert" on public.reminder_settings;
create policy "reminder settings own row upsert"
  on public.reminder_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminder settings own row update" on public.reminder_settings;
create policy "reminder settings own row update"
  on public.reminder_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reminder logs own row select" on public.reminder_logs;
create policy "reminder logs own row select"
  on public.reminder_logs
  for select
  using (auth.uid() = user_id);
