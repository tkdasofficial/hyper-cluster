create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'jobs_worker_token') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'jobs_worker_token', 'Token used by scheduled job worker calls');
  end if;
  if not exists (select 1 from vault.secrets where name = 'jobs_worker_url') then
    perform vault.create_secret('https://project--cfb6794e-b945-4064-9f72-6ea003a19ac5.lovable.app/api/public/jobs/worker', 'jobs_worker_url', 'Background job worker endpoint');
  end if;
end $$;

create or replace function public.verify_worker_token(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = 'jobs_worker_token';
  return v is not null and p_token = v;
end;
$$;

revoke all on function public.verify_worker_token(text) from public, anon, authenticated;
grant execute on function public.verify_worker_token(text) to service_role;

create or replace function public.kick_job_worker()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_token text; v_url text; v_paused boolean;
begin
  -- Skip scheduled work entirely while the queue is parked, except for one probe run.
  select paused into v_paused from public.job_runner where id = 'default';
  if not exists (select 1 from public.jobs where status in ('queued','running') and next_run_at <= now()) then
    return;
  end if;
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'jobs_worker_token';
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'jobs_worker_url';
  if v_token is null or v_url is null then return; end if;
  perform extensions.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type','application/json','x-worker-secret', v_token),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
end;
$$;

revoke all on function public.kick_job_worker() from public, anon, authenticated;

select cron.unschedule('hyper-job-worker') where exists (select 1 from cron.job where jobname = 'hyper-job-worker');
select cron.schedule('hyper-job-worker', '* * * * *', $$select public.kick_job_worker();$$);