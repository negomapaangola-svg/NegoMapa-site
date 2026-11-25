-- Fase 5: conclusão obrigatória do perfil após conversão.
-- A conclusão regista apenas o preenchimento; nunca aprova nem publica o perfil.
begin;

alter table public.profissionais
  add column if not exists profile_completed_at timestamptz;

alter table public.companies
  add column if not exists profile_completed_at timestamptz;

alter table public.account_status_audit
  drop constraint if exists account_status_audit_action_check;

alter table public.account_status_audit
  add constraint account_status_audit_action_check
  check (action = any (array[
    'deactivate'::text,
    'reactivate'::text,
    'suspend'::text,
    'restore'::text,
    'request_deletion'::text,
    'confirm_deletion'::text,
    'convert_account'::text,
    'complete_profile'::text
  ]));

-- Leitura privada dos campos necessários ao formulário único /conta/perfil.
create or replace function public.get_my_profile_completion()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_type text;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  select p.account_type into v_type
  from public.profiles p
  where p.id = v_user and p.is_active is true;

  if not found then
    raise exception 'Conta não encontrada ou inactiva' using errcode = '42501';
  end if;

  if v_type = 'profissional' then
    select jsonb_build_object(
      'account_type', v_type,
      'profile_completed_at', p.profile_completed_at,
      'experiencia_faixa', p.experiencia_faixa
    ) into v_result
    from public.profissionais p
    where p.user_id = v_user;
  elsif v_type = 'empresa' then
    select jsonb_build_object(
      'account_type', v_type,
      'profile_completed_at', c.profile_completed_at,
      'email', c.email
    ) into v_result
    from public.companies c
    where c.user_id = v_user
    order by c.created_at asc
    limit 1;
  else
    return jsonb_build_object('account_type', v_type);
  end if;

  if v_result is null then
    raise exception 'Perfil não encontrado' using errcode = 'P0002';
  end if;

  return v_result;
end;
$function$;

revoke all on function public.get_my_profile_completion() from public, anon;
grant execute on function public.get_my_profile_completion() to authenticated;

-- A validação, timestamp e auditoria são atómicos. A função nunca altera
-- profissionais.estado nem companies.is_approved.
create or replace function public.complete_my_profile(p_profile_type text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_account_type text;
  v_is_active boolean;
  v_profile_id uuid;
  v_completed_at timestamptz;
  v_status text;
  v_missing text[] := array[]::text[];
  v_email text;
begin
  if v_user is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  select p.account_type, p.is_active
    into v_account_type, v_is_active
  from public.profiles p
  where p.id = v_user
  for update;

  if not found or v_is_active is distinct from true then
    raise exception 'Conta não encontrada ou inactiva' using errcode = '42501';
  end if;

  if p_profile_type not in ('profissional', 'empresa')
     or v_account_type is distinct from p_profile_type then
    raise exception 'Tipo de conta inválido' using errcode = '22023';
  end if;

  if p_profile_type = 'profissional' then
    select p.id, p.profile_completed_at, p.estado
      into v_profile_id, v_completed_at, v_status
    from public.profissionais p
    where p.user_id = v_user
    for update;

    if not found then
      raise exception 'Perfil profissional não pertence a esta conta' using errcode = '42501';
    end if;

    if v_status <> 'pendente' then
      raise exception 'O perfil profissional já não está pendente de aprovação' using errcode = '22023';
    end if;

    select array_remove(array[
      case when nullif(btrim(p.nome), '') is null then 'nome' end,
      case when p.categoria_id is null then 'categoria_id' end,
      case when nullif(btrim(p.provincia), '') is null then 'provincia' end,
      case when nullif(btrim(p.municipio), '') is null then 'municipio' end,
      case when nullif(btrim(p.experiencia_faixa), '') is null then 'experiencia_faixa' end,
      case when nullif(btrim(p.bio), '') is null then 'bio' end,
      case when nullif(btrim(p.telefone), '') is null
             and nullif(btrim(p.whatsapp), '') is null then 'telefone_ou_whatsapp' end
    ]::text[], null)
    into v_missing
    from public.profissionais p
    where p.id = v_profile_id;

    if cardinality(v_missing) > 0 then
      raise exception 'Perfil incompleto: %', array_to_string(v_missing, ', ')
        using errcode = '22023';
    end if;

    if v_completed_at is not null then
      return jsonb_build_object('completed', true, 'already_completed', true,
        'profile_type', p_profile_type, 'profile_id', v_profile_id,
        'profile_completed_at', v_completed_at);
    end if;

    update public.profissionais
       set profile_completed_at = now(), updated_at = now()
     where id = v_profile_id
     returning profile_completed_at into v_completed_at;
  else
    select c.id, c.profile_completed_at, c.is_approved, c.estado, c.email
      into v_profile_id, v_completed_at, v_is_active, v_status, v_email
    from public.companies c
    where c.user_id = v_user
    order by c.created_at asc
    limit 1
    for update;

    if not found then
      raise exception 'Empresa não pertence a esta conta' using errcode = '42501';
    end if;

    if v_is_active is distinct from false then
      raise exception 'A empresa já está aprovada e não pode ser concluída por este fluxo' using errcode = '22023';
    end if;

    select array_remove(array[
      case when nullif(btrim(c.name), '') is null then 'name' end,
      case when nullif(btrim(c.sector), '') is null then 'sector' end,
      case when nullif(btrim(c.province), '') is null then 'province' end,
      case when nullif(btrim(c.city), '') is null then 'city' end,
      case when nullif(btrim(c.description), '') is null then 'description' end,
      case when nullif(btrim(c.email), '') is null
             or c.email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
           then 'email' end,
      case when nullif(btrim(c.phone), '') is null
             and nullif(btrim(c.whatsapp), '') is null then 'phone_or_whatsapp' end
    ]::text[], null)
    into v_missing
    from public.companies c
    where c.id = v_profile_id;

    if cardinality(v_missing) > 0 then
      raise exception 'Perfil incompleto: %', array_to_string(v_missing, ', ')
        using errcode = '22023';
    end if;

    if v_completed_at is not null then
      return jsonb_build_object('completed', true, 'already_completed', true,
        'profile_type', p_profile_type, 'profile_id', v_profile_id,
        'profile_completed_at', v_completed_at);
    end if;

    update public.companies
       set profile_completed_at = now()
     where id = v_profile_id
     returning profile_completed_at into v_completed_at;
    v_status := coalesce(v_status, 'pendente');
  end if;

  insert into public.account_status_audit
    (actor_id, target_id, action, previous_status, new_status, metadata)
  values
    (v_user, v_user, 'complete_profile', v_status, v_status,
     jsonb_build_object(
       'profile_type', p_profile_type,
       'profile_id', v_profile_id,
       'profile_completed_at', v_completed_at
     ));

  return jsonb_build_object('completed', true, 'already_completed', false,
    'profile_type', p_profile_type, 'profile_id', v_profile_id,
    'profile_completed_at', v_completed_at);
end;
$function$;

revoke all on function public.complete_my_profile(text) from public, anon;
grant execute on function public.complete_my_profile(text) to authenticated;

commit;
