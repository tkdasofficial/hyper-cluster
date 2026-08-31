create or replace function public.set_provider_secret(p_name text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = p_name;
  if v_id is null then
    perform vault.create_secret(p_value, p_name, 'provider api key');
  else
    perform vault.update_secret(v_id, p_value, p_name, 'provider api key');
  end if;
end;
$$;

create or replace function public.get_provider_secret(p_name text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = p_name;
  return v;
end;
$$;

revoke all on function public.set_provider_secret(text, text) from public, anon, authenticated;
revoke all on function public.get_provider_secret(text) from public, anon, authenticated;
grant execute on function public.set_provider_secret(text, text) to service_role;
grant execute on function public.get_provider_secret(text) to service_role;