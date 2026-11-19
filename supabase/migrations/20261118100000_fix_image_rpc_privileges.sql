-- Corrige privilégios dos RPCs: funções SECURITY DEFINER ficam no schema privado.
begin;

revoke all on function private.imagem_publica_aprovada(text,text) from public, anon, authenticated;
grant execute on function private.imagem_publica_aprovada(text,text) to service_role;

create or replace function public.pode_servir_imagem(p_bucket text, p_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.imagem_publica_aprovada(p_bucket, p_name) $$;
revoke all on function public.pode_servir_imagem(text,text) from public, anon, authenticated;
grant execute on function public.pode_servir_imagem(text,text) to service_role;

create or replace function private.pode_apagar_imagem(p_bucket text, p_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table record;
  v_referenced boolean;
begin
  if auth.uid() is null
     or p_bucket not in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
     or p_name !~ '^[0-9a-fA-F-]{36}/(avatar|portfolio)/[0-9a-fA-F-]{36}\.(webp|jpg|png)$'
     or split_part(p_name,'/',1) <> auth.uid()::text then
    return false;
  end if;
  for v_table in
    select table_name from information_schema.tables
    where table_schema='public' and table_type in ('BASE TABLE','VIEW','FOREIGN')
  loop
    execute format(
      'select exists(select 1 from public.%I as r where position($1 in to_jsonb(r)::text) > 0)',
      v_table.table_name
    ) into v_referenced using p_name;
    if v_referenced then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function private.pode_apagar_imagem(text,text) from public, anon, authenticated;
grant execute on function private.pode_apagar_imagem(text,text) to authenticated;

create or replace function public.pode_apagar_imagem(p_bucket text, p_name text)
returns boolean
language sql
security invoker
set search_path = ''
as $$ select private.pode_apagar_imagem(p_bucket, p_name) $$;
revoke all on function public.pode_apagar_imagem(text,text) from public, anon;
grant execute on function public.pode_apagar_imagem(text,text) to authenticated;

commit;
