-- Fase 4 (correção urgente): conversão de cliente para empresa.
-- Substitui convert_client_account(text, text) para preencher sector e province,
-- que são NOT NULL em public.companies. Não altera a migração 20261123230000.
-- Mantém: só cliente activo converte; perfil criado fica pendente; empresa com is_approved = false;
-- auditoria convert_account.

begin;

create or replace function public.convert_client_account(
  p_target_role text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_account_type text;
  v_account_status text;
  v_provincia text;
  v_profile_id uuid;
  v_slug_base text;
  v_slug text;
  v_suffix text;
begin
  if v_user is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  if p_target_role not in ('profissional', 'empresa') then
    raise exception 'Tipo de conta inválido' using errcode = '22023';
  end if;

  select account_type, account_status, localizacao_provincia
  into v_account_type, v_account_status, v_provincia
  from public.profiles
  where id = v_user
  for update;

  if not found then
    raise exception 'Conta não encontrada' using errcode = 'P0002';
  end if;

  if v_account_type <> 'cliente' then
    raise exception 'Apenas contas de cliente podem ser convertidas' using errcode = '22023';
  end if;

  if v_account_status <> 'active' then
    raise exception 'A conta precisa estar activa para ser convertida' using errcode = '22023';
  end if;

  if p_display_name is null or char_length(btrim(p_display_name)) < 2
     or char_length(btrim(p_display_name)) > 160 then
    raise exception 'Indique um nome de apresentação entre 2 e 160 caracteres' using errcode = '22023';
  end if;

  if exists (select 1 from public.profissionais where user_id = v_user)
     or exists (select 1 from public.companies where user_id = v_user) then
    raise exception 'Esta conta já tem um perfil profissional ou empresarial associado' using errcode = '22023';
  end if;

  v_slug_base := lower(
    regexp_replace(
      btrim(p_display_name),
      '[^a-z0-9]+',
      '-',
      'gi'
    )
  );
  v_slug_base := btrim(v_slug_base, '-');

  if v_slug_base = '' then
    v_slug_base := 'conta';
  end if;

  v_suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  v_slug := left(v_slug_base || '-' || v_suffix, 190);

  perform set_config('negomapa.self_service_account', 'on', true);

  update public.profiles
  set account_type = p_target_role,
      updated_at = now()
  where id = v_user;

  if p_target_role = 'profissional' then
    insert into public.profissionais (user_id, nome, slug, estado)
    values (v_user, btrim(p_display_name), v_slug, 'pendente')
    returning id into v_profile_id;
  else
    insert into public.companies (user_id, name, slug, sector, province, is_approved)
    values (
      v_user,
      btrim(p_display_name),
      v_slug,
      'Geral',
      coalesce(nullif(btrim(v_provincia), ''), 'Não indicada'),
      false
    )
    returning id into v_profile_id;
  end if;

  insert into public.account_status_audit
    (actor_id, target_id, action, previous_status, new_status, metadata)
  values
    (
      v_user,
      v_user,
      'convert_account',
      v_account_status,
      v_account_status,
      jsonb_build_object(
        'previous_account_type', v_account_type,
        'new_account_type', p_target_role,
        'profile_id', v_profile_id
      )
    );

  return jsonb_build_object(
    'account_type', p_target_role,
    'profile_id', v_profile_id,
    'redirect', '/conta/perfil'
  );
end;
$$;

revoke all on function public.convert_client_account(text, text)
  from public, anon;

grant execute on function public.convert_client_account(text, text)
  to authenticated;

commit;
