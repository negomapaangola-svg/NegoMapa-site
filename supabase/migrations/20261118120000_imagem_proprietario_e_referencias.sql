-- Fase 1: permitir leitura privada do próprio dono e compatibilidade de referências legadas.
begin;

create or replace function private.imagem_publica_aprovada(p_bucket text, p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner text;
  v_folder text;
  v_legacy_company_logo boolean := false;
begin
  if p_bucket not in ('profissionais-avatars','profissionais-portfolio','empresas-logos','empresas-portfolio') then
    return false;
  end if;

  if p_name ~ '^[0-9a-fA-F-]{36}/(avatar|avatars|portfolio)/[0-9a-fA-F-]{36}\.(webp|jpg|png)$' then
    v_folder := split_part(p_name, '/', 2);
  elsif p_bucket = 'empresas-logos'
        and p_name ~ '^[0-9a-fA-F-]{36}/logotipo-[0-9]+\.(webp|jpg|png)$' then
    v_folder := 'legacy-logo';
    v_legacy_company_logo := true;
  else
    return false;
  end if;

  v_owner := split_part(p_name, '/', 1);

  -- O endpoint da aplicação serve conteúdo privado do dono com JWT/RLS.
  -- Este RPC é chamado apenas no percurso público com service_role, sem auth.uid().

  if p_bucket in ('profissionais-avatars','profissionais-portfolio') then
    return exists (
      select 1
      from public.profissionais p
      join public.profiles pr on pr.id = p.user_id
      where p.user_id::text = v_owner
        and p.estado = 'aprovado'
        and pr.is_active is true
        and pr.deleted_at is null
        and (
          (p_bucket = 'profissionais-avatars' and v_folder in ('avatar','avatars')
            and coalesce(p.avatar_url,'') like '%' || p_name || '%')
          or
          (p_bucket = 'profissionais-portfolio' and v_folder = 'portfolio'
            and coalesce(p.portfolio::text,'') like '%' || p_name || '%')
        )
    );
  end if;

  if p_bucket in ('empresas-logos','empresas-portfolio') then
    return exists (
      select 1
      from public.companies c
      join public.profiles pr on pr.id = c.user_id
      where c.user_id::text = v_owner
        and c.is_approved is true
        and pr.is_active is true
        and pr.deleted_at is null
        and (
          (p_bucket = 'empresas-logos' and (v_folder = 'avatar' or v_legacy_company_logo)
            and coalesce(c.logo_url,'') like '%' || p_name || '%')
          or
          (p_bucket = 'empresas-portfolio' and v_folder = 'portfolio'
            and coalesce(c.portfolio::text,'') like '%' || p_name || '%')
        )
    );
  end if;

  return false;
end;
$$;

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

commit;
