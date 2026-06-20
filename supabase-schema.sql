create table if not exists public.duo_kitchen_households (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.duo_kitchen_households enable row level security;

drop policy if exists "authenticated users can read duo kitchens" on public.duo_kitchen_households;
create policy "authenticated users can read duo kitchens"
on public.duo_kitchen_households
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create duo kitchens" on public.duo_kitchen_households;
create policy "authenticated users can create duo kitchens"
on public.duo_kitchen_households
for insert
to authenticated
with check (auth.uid() = updated_by);

drop policy if exists "authenticated users can update duo kitchens" on public.duo_kitchen_households;
create policy "authenticated users can update duo kitchens"
on public.duo_kitchen_households
for update
to authenticated
using (true)
with check (auth.uid() = updated_by);
