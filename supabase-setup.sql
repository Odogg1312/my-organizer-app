create table if not exists public.organizer_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.organizer_data enable row level security;

revoke all on public.organizer_data from anon;
grant select, insert, update on public.organizer_data to authenticated;

drop policy if exists "Users read their own organizer data" on public.organizer_data;
create policy "Users read their own organizer data"
on public.organizer_data
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their own organizer data" on public.organizer_data;
create policy "Users insert their own organizer data"
on public.organizer_data
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own organizer data" on public.organizer_data;
create policy "Users update their own organizer data"
on public.organizer_data
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
