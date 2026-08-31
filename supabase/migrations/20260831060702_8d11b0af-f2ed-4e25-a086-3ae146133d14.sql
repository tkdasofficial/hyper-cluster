create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  lease_until timestamptz,
  next_run_at timestamptz not null default now(),
  generation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists jobs_user_created_idx on public.jobs (user_id, created_at desc);
create index if not exists jobs_pickup_idx on public.jobs (status, next_run_at);

grant select, insert, update on public.jobs to authenticated;
grant all on public.jobs to service_role;

alter table public.jobs enable row level security;

create policy "Users read own jobs" on public.jobs
  for select to authenticated using (auth.uid() = user_id);
create policy "Users create own jobs" on public.jobs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users cancel own jobs" on public.jobs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.job_runner (
  id text primary key default 'default',
  paused boolean not null default false,
  paused_reason text,
  paused_at timestamptz,
  lock_until timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.job_runner (id) values ('default') on conflict do nothing;

grant all on public.job_runner to service_role;
alter table public.job_runner enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

-- Atomically leases a bounded batch of due jobs to a single worker run.
create or replace function public.claim_jobs(p_limit int, p_lease_seconds int)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.jobs j
  set status = 'running',
      lease_until = now() + make_interval(secs => p_lease_seconds),
      attempts = j.attempts + 1
  where j.id in (
    select id from public.jobs
    where next_run_at <= now()
      and (status = 'queued' or (status = 'running' and (lease_until is null or lease_until < now())))
    order by next_run_at asc
    limit p_limit
    for update skip locked
  )
  returning j.*;
end;
$$;

revoke all on function public.claim_jobs(int, int) from public, anon, authenticated;
grant execute on function public.claim_jobs(int, int) to service_role;