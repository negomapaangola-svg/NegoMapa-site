-- ARQUIVADO: não aplicar. Decisão da sessão central.
-- Motivo: estado já coberto pelo baseline / migrações registadas.
-- Fase 1: Storage privado, autorização de leitura pública via rota server-side e limpeza conservadora.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Remover a política antiga e a função pública antes de recriar a autorização.
drop policy if exists imagens_publicas_aprovadas on storage.objects;
drop policy if exists empresas_portfolio_public_approved on storage.objects;
drop function if exists public.imagem_publica_aprovada(text,text);

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
begin
  if p_bucket not in ('profissionais-avatars','profissionais-portfolio','empresas-logos','empresas-portfolio') then
    return false;
  end if;
  if p_name !~ '^[0-9a-fA-F-]{36}/(avatar|portfolio)/[0-9a-fA-F-]{36}\.(webp|jpg|png)$' then
    return false;
  end if;

  v_owner := split_part(p_name, '/', 1);
  v_folder := split_part(p_name, '/', 2);

  -- O proprietário autenticado pode pré-visualizar o próprio conteúdo, mesmo antes da aprovação.
  if auth.uid() is not null and v_owner = auth.uid()::text then
    return true;
  end if;

  -- Acesso público apenas para profissionais aprovados e com conta activa.
  if p_bucket in ('profissionais-avatars','profissionais-portfolio') then
    return exists (
      select 1
      from public.profissionais p
      join public.profiles pr on pr.id = p.user_id
      where p.user_id::text = v_owner
        and p.estado = 'aprovado'
        and pr.is_active is true
        and pr.deleted_at is null
        and ((p_bucket = 'profissionais-avatars' and v_folder = 'avatar' and coalesce(p.avatar_url,'') like '%' || p_name || '%')
          or (p_bucket = 'profissionais-portfolio' and v_folder = 'portfolio' and coalesce(p.portfolio::text,'') like '%' || p_name || '%'))
    );
  end if;

  -- Empresas: aprovação explícita e perfil associado activo, sem exclusão lógica.
  if p_bucket in ('empresas-logos','empresas-portfolio') then
    return exists (
      select 1
      from public.companies c
      join public.profiles pr on pr.id = c.user_id
      where c.user_id::text = v_owner
        and c.is_approved is true
        and pr.is_active is true
        and pr.deleted_at is null
        and ((p_bucket = 'empresas-logos' and v_folder = 'avatar' and coalesce(c.logo_url,'') like '%' || p_name || '%')
          or (p_bucket = 'empresas-portfolio' and v_folder = 'portfolio' and coalesce(c.portfolio::text,'') like '%' || p_name || '%'))
    );
  end if;

  return false;
end;
$$;

revoke all on function private.imagem_publica_aprovada(text,text) from public;
revoke all on function private.imagem_publica_aprovada(text,text) from anon, authenticated, public;
grant execute on function private.imagem_publica_aprovada(text,text) to service_role;

-- Wrapper de resultado booleano para a rota server-side; não devolve dados nem caminhos.
create or replace function public.pode_servir_imagem(p_bucket text, p_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $ select private.imagem_publica_aprovada(p_bucket, p_name) $;
revoke all on function public.pode_servir_imagem(text,text) from public, anon, authenticated;
grant execute on function public.pode_servir_imagem(text,text) to service_role;

-- Buckets sempre privados. O endpoint da aplicação usa service role apenas depois de validar pode_servir_imagem.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('profissionais-avatars','profissionais-avatars',false,10485760,array['image/jpeg','image/png','image/webp']::text[]),
 ('empresas-logos','empresas-logos',false,10485760,array['image/jpeg','image/png','image/webp']::text[]),
 ('profissionais-portfolio','profissionais-portfolio',false,10485760,array['image/jpeg','image/png','image/webp']::text[]),
 ('clientes-avatars','clientes-avatars',false,10485760,array['image/jpeg','image/png','image/webp']::text[]),
 ('empresas-portfolio','empresas-portfolio',false,10485760,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update set
  public=false,
  file_size_limit=10485760,
  allowed_mime_types=array['image/jpeg','image/png','image/webp']::text[];

-- Remover políticas antigas, inclusive a exceção de leitura administrativa entre contas.
drop policy if exists imagens_dono_select on storage.objects;
drop policy if exists imagens_dono_insert on storage.objects;
drop policy if exists imagens_dono_update on storage.objects;
drop policy if exists imagens_dono_delete on storage.objects;
drop policy if exists empresas_logos_select_admin on storage.objects;
drop policy if exists clientes_avatar_select_owner on storage.objects;
drop policy if exists clientes_avatar_insert_owner on storage.objects;
drop policy if exists clientes_avatar_update_owner on storage.objects;
drop policy if exists clientes_avatar_delete_owner on storage.objects;
drop policy if exists empresas_portfolio_select_owner on storage.objects;
drop policy if exists empresas_portfolio_insert_owner on storage.objects;
drop policy if exists empresas_portfolio_update_owner on storage.objects;
drop policy if exists empresas_portfolio_delete_owner on storage.objects;

create policy imagens_dono_select on storage.objects
for select to authenticated
using (
  bucket_id in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy imagens_dono_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy imagens_dono_update on storage.objects
for update to authenticated
using (
  bucket_id in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy imagens_dono_delete on storage.objects
for delete to authenticated
using (
  bucket_id in ('profissionais-avatars','empresas-logos','profissionais-portfolio','clientes-avatars','empresas-portfolio')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Não existe SELECT para anon em storage.objects. Imagens aprovadas passam exclusivamente pela rota.
-- O bucket clientes-avatars nunca é incluído na função de leitura pública.

-- Verifica referências em todas as tabelas/views públicas; em caso de dúvida, não autoriza apagar.
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
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type in ('BASE TABLE','VIEW','FOREIGN')
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


-- Reescrever URLs históricas para a rota segura; os buckets continuam privados.
update public.profissionais
set avatar_url = regexp_replace(
  avatar_url,
  'https?://[^/]+/storage/v1/object/(public|sign)/profissionais-avatars/',
  '/api/imagens/profissionais-avatars/',
  'g'
)
where avatar_url ~ 'https?://[^/]+/storage/v1/object/(public|sign)/profissionais-avatars/';

update public.companies
set logo_url = regexp_replace(
  logo_url,
  'https?://[^/]+/storage/v1/object/(public|sign)/empresas-logos/',
  '/api/imagens/empresas-logos/',
  'g'
)
where logo_url ~ 'https?://[^/]+/storage/v1/object/(public|sign)/empresas-logos/';

update public.profissionais
set portfolio = regexp_replace(
  portfolio::text,
  'https?://[^/]+/storage/v1/object/(public|sign)/profissionais-portfolio/',
  '/api/imagens/profissionais-portfolio/',
  'g'
)::jsonb
where portfolio is not null
  and portfolio::text ~ 'https?://[^/]+/storage/v1/object/(public|sign)/profissionais-portfolio/';

update public.companies
set portfolio = regexp_replace(
  portfolio::text,
  'https?://[^/]+/storage/v1/object/(public|sign)/empresas-portfolio/',
  '/api/imagens/empresas-portfolio/',
  'g'
)::jsonb
where portfolio is not null
  and portfolio::text ~ 'https?://[^/]+/storage/v1/object/(public|sign)/empresas-portfolio/';

commit;
