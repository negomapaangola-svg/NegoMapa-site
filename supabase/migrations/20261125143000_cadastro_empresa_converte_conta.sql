-- Correcao do cadastro empresarial: um cliente que cria empresa passa a empresa.
begin;

create or replace function public.criar_empresa_cliente(p_dados jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_account_type text;
  v_account_status text;
  v_company_id uuid;
  v_nome text;
  v_slug text;
  v_setor text;
  v_provincia text;
  v_municipio text;
  v_email text;
begin
  if v_user is null then
    raise exception 'Sessao invalida' using errcode = '42501';
  end if;

  select account_type, account_status
  into v_account_type, v_account_status
  from public.profiles
  where id = v_user
  for update;

  if not found then
    raise exception 'Conta nao encontrada' using errcode = 'P0002';
  end if;

  if v_account_type <> 'cliente' then
    raise exception 'Apenas contas de cliente podem criar uma empresa' using errcode = '22023';
  end if;

  if v_account_status <> 'active' then
    raise exception 'A conta precisa estar activa para criar uma empresa' using errcode = '22023';
  end if;

  if exists (select 1 from public.profissionais where user_id = v_user)
     or exists (select 1 from public.companies where user_id = v_user) then
    raise exception 'Esta conta ja tem um perfil profissional ou empresarial associado' using errcode = '22023';
  end if;

  v_nome := btrim(coalesce(p_dados->>'nome', ''));
  v_slug := btrim(coalesce(p_dados->>'slug', ''));
  v_setor := btrim(coalesce(p_dados->>'setor', ''));
  v_provincia := btrim(coalesce(p_dados->>'provincia', ''));
  v_municipio := btrim(coalesce(p_dados->>'municipio', ''));
  v_email := lower(btrim(coalesce(p_dados->>'email', '')));

  if char_length(v_nome) < 2 or char_length(v_nome) > 160 then
    raise exception 'Nome da empresa invalido' using errcode = '22023';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(v_slug) > 190 then
    raise exception 'Slug invalido' using errcode = '22023';
  end if;

  if v_setor = '' or char_length(v_setor) > 100 then
    raise exception 'Setor invalido' using errcode = '22023';
  end if;

  if v_provincia = '' or char_length(v_provincia) > 80 then
    raise exception 'Provincia invalida' using errcode = '22023';
  end if;

  if v_municipio = '' or char_length(v_municipio) > 100 then
    raise exception 'Municipio invalido' using errcode = '22023';
  end if;

  if v_email = '' or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' or char_length(v_email) > 254 then
    raise exception 'Email invalido' using errcode = '22023';
  end if;

  perform set_config('negomapa.self_service_account', 'on', true);

  insert into public.companies (
    user_id,
    name,
    slug,
    sector,
    province,
    city,
    bairro,
    description,
    phone,
    whatsapp,
    email,
    website,
    logo_url,
    nif,
    estado_legalizacao,
    documento_legalizacao_path,
    is_approved
  ) values (
    v_user,
    v_nome,
    v_slug,
    v_setor,
    v_provincia,
    v_municipio,
    nullif(btrim(coalesce(p_dados->>'bairro', '')), ''),
    nullif(btrim(coalesce(p_dados->>'descricao', '')), ''),
    btrim(coalesce(p_dados->>'telefone', '')),
    btrim(coalesce(p_dados->>'whatsapp', '')),
    v_email,
    nullif(btrim(coalesce(p_dados->>'website', '')), ''),
    nullif(p_dados->>'logoPath', ''),
    case when coalesce(p_dados->>'legalizada', 'false')::boolean then nullif(btrim(coalesce(p_dados->>'nif', '')), '') else null end,
    case when coalesce(p_dados->>'legalizada', 'false')::boolean then 'legalizada' else null end,
    case when coalesce(p_dados->>'legalizada', 'false')::boolean then nullif(p_dados->>'documentoPath', '') else null end,
    false
  )
  returning id into v_company_id;

  update public.profiles
  set account_type = 'empresa',
      updated_at = now()
  where id = v_user;

  insert into public.account_status_audit (
    actor_id,
    target_id,
    action,
    previous_status,
    new_status,
    metadata
  ) values (
    v_user,
    v_user,
    'convert_account',
    v_account_status,
    v_account_status,
    jsonb_build_object(
      'previous_account_type', v_account_type,
      'new_account_type', 'empresa',
      'company_id', v_company_id,
      'origem', 'cadastro_empresarial'
    )
  );

  return v_company_id;
end;
$function$;

revoke all on function public.criar_empresa_cliente(jsonb)
  from public, anon;

grant execute on function public.criar_empresa_cliente(jsonb)
  to authenticated;

commit;