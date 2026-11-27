-- Fase 4: pedidos de mudança de tipo de conta com aprovação administrativa.
-- A conta mantém account_type = 'cliente' até a decisão de aprovação.
-- Esta migração é entregue para revisão; não foi aplicada a qualquer base de dados.

begin;

create table if not exists public.account_type_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_account_type text not null default 'cliente'
    check (current_account_type = 'cliente'),
  requested_account_type text not null
    check (requested_account_type in ('profissional', 'empresa')),
  display_name text not null
    check (char_length(btrim(display_name)) between 2 and 160),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_reason text,
  constraint account_type_change_review_state_check check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or
    (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  ),
  constraint account_type_change_review_reason_length check (
    (status = 'pending' and review_reason is null)
    or
    (status in ('approved', 'rejected')
      and review_reason is not null
      and char_length(btrim(review_reason)) between 10 and 1000)
  )
);

create index if not exists account_type_change_requests_user_idx
  on public.account_type_change_requests (user_id, requested_at desc);
create index if not exists account_type_change_requests_pending_idx
  on public.account_type_change_requests (requested_at)
  where status = 'pending';
create unique index if not exists account_type_change_requests_one_pending_per_user
  on public.account_type_change_requests (user_id)
  where status = 'pending';

alter table public.account_type_change_requests enable row level security;
revoke all on public.account_type_change_requests from public, anon, authenticated, service_role;

create or replace function public.request_account_type_change(
  p_requested_type text,
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
  v_existing_id uuid;
  v_existing_type text;
  v_request_id uuid;
  v_has_professional boolean;
  v_has_company boolean;
begin
  if v_user is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  if public.is_admin() then
    raise exception 'Contas administrativas não podem pedir mudança de tipo' using errcode = '42501';
  end if;

  if p_requested_type is null or p_requested_type not in ('profissional', 'empresa') then
    raise exception 'Tipo de conta solicitado inválido' using errcode = '22023';
  end if;

  if p_display_name is null or char_length(btrim(p_display_name)) < 2
     or char_length(btrim(p_display_name)) > 160 then
    raise exception 'Indique um nome entre 2 e 160 caracteres' using errcode = '22023';
  end if;

  select account_type, account_status
    into v_account_type, v_account_status
  from public.profiles
  where id = v_user
  for update;

  if not found then
    raise exception 'Perfil de conta não encontrado' using errcode = 'P0002';
  end if;

  if v_account_type is distinct from 'cliente' then
    raise exception 'Apenas contas de cliente podem pedir esta mudança' using errcode = '22023';
  end if;

  if v_account_status is distinct from 'active' then
    raise exception 'A conta precisa de estar activa para pedir esta mudança' using errcode = '22023';
  end if;

  select exists(select 1 from public.profissionais where user_id = v_user),
         exists(select 1 from public.companies where user_id = v_user)
    into v_has_professional, v_has_company;

  if v_has_professional and v_has_company then
    raise exception 'A conta tem mais de um perfil de negócio associado; contacte o administrador' using errcode = '22023';
  end if;

  if p_requested_type = 'profissional' and v_has_company then
    raise exception 'Esta conta já tem uma empresa associada' using errcode = '22023';
  end if;

  if p_requested_type = 'empresa' and v_has_professional then
    raise exception 'Esta conta já tem um perfil profissional associado' using errcode = '22023';
  end if;

  select id, requested_account_type
    into v_existing_id, v_existing_type
  from public.account_type_change_requests
  where user_id = v_user and status = 'pending'
  for update;

  if found then
    if v_existing_type = p_requested_type then
      return jsonb_build_object(
        'request_id', v_existing_id,
        'status', 'pending',
        'already_pending', true
      );
    end if;
    raise exception 'Já existe um pedido pendente para outro tipo de conta' using errcode = '23505';
  end if;

  insert into public.account_type_change_requests
    (user_id, current_account_type, requested_account_type, display_name)
  values
    (v_user, 'cliente', p_requested_type, btrim(p_display_name))
  returning id into v_request_id;

  return jsonb_build_object(
    'request_id', v_request_id,
    'status', 'pending',
    'already_pending', false
  );
end;
$$;


-- Cada RPC abaixo cria o perfil e o pedido na mesma transacção PostgreSQL.
-- Qualquer falha na inserção do pedido reverte também a criação do perfil.
create or replace function public.create_professional_profile_and_request(
  p_profile_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_user uuid := auth.uid();
  v_profile public.profissionais;
  v_profile_id uuid;
  v_request jsonb;
begin
  if v_user is null or public.is_admin() then
    raise exception 'Sessão inválida ou conta administrativa' using errcode = '42501';
  end if;
  if jsonb_typeof(p_profile_data) is distinct from 'object' then
    raise exception 'Dados do perfil inválidos' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_profile_data) as supplied(key)
    where supplied.key not in (
      'nome', 'slug', 'provincia', 'municipio', 'bairro',
      'latitude_aproximada', 'longitude_aproximada', 'categoria_id',
      'especialidades', 'bio', 'experiencia_faixa', 'faixa_preco_desde',
      'disponibilidade', 'telefone', 'whatsapp'
    )
  ) then
    raise exception 'O perfil contém campos não permitidos' using errcode = '22023';
  end if;

  select *
    into v_profile
  from jsonb_populate_record(
    null::public.profissionais,
    p_profile_data || jsonb_build_object('user_id', v_user, 'estado', 'pendente')
  );

  if v_profile.nome is null or char_length(btrim(v_profile.nome)) not between 2 and 120
     or v_profile.slug is null or char_length(v_profile.slug) not between 1 and 190 then
    raise exception 'Nome ou identificador do perfil inválido' using errcode = '22023';
  end if;

  perform 1
  from public.profiles
  where id = v_user
    and account_type = 'cliente'
    and account_status = 'active'
  for update;
  if not found then
    raise exception 'Apenas contas cliente activas podem criar este perfil' using errcode = '22023';
  end if;

  if exists (select 1 from public.profissionais where user_id = v_user)
     or exists (select 1 from public.companies where user_id = v_user) then
    raise exception 'Esta conta já tem um perfil profissional ou empresarial associado' using errcode = '23505';
  end if;

  insert into public.profissionais (
    user_id, nome, slug, provincia, municipio, bairro,
    latitude_aproximada, longitude_aproximada, categoria_id,
    especialidades, bio, experiencia_faixa, faixa_preco_desde,
    disponibilidade, telefone, whatsapp, estado
  ) values (
    v_user, btrim(v_profile.nome), v_profile.slug, v_profile.provincia,
    v_profile.municipio, v_profile.bairro, v_profile.latitude_aproximada,
    v_profile.longitude_aproximada, v_profile.categoria_id,
    v_profile.especialidades, v_profile.bio, v_profile.experiencia_faixa,
    v_profile.faixa_preco_desde, v_profile.disponibilidade,
    v_profile.telefone, v_profile.whatsapp, 'pendente'
  ) returning id into v_profile_id;

  v_request := public.request_account_type_change('profissional', v_profile.nome);
  return v_request || jsonb_build_object('profile_id', v_profile_id);
end;
$body$;


create or replace function public.create_company_profile_and_request(
  p_profile_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_user uuid := auth.uid();
  v_profile public.companies;
  v_profile_id uuid;
  v_request jsonb;
begin
  if v_user is null or public.is_admin() then
    raise exception 'Sessão inválida ou conta administrativa' using errcode = '42501';
  end if;
  if jsonb_typeof(p_profile_data) is distinct from 'object' then
    raise exception 'Dados do perfil inválidos' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_profile_data) as supplied(key)
    where supplied.key not in (
      'name', 'slug', 'sector', 'province', 'city', 'bairro',
      'latitude_aproximada', 'longitude_aproximada', 'description',
      'phone', 'whatsapp', 'email', 'website', 'logo_url', 'nif',
      'estado_legalizacao', 'documento_legalizacao_path'
    )
  ) then
    raise exception 'O perfil empresarial contém campos não permitidos' using errcode = '22023';
  end if;

  select *
    into v_profile
  from jsonb_populate_record(
    null::public.companies,
    p_profile_data || jsonb_build_object('user_id', v_user, 'is_approved', false)
  );

  if v_profile.name is null or char_length(btrim(v_profile.name)) not between 2 and 160
     or v_profile.slug is null or char_length(v_profile.slug) not between 1 and 190 then
    raise exception 'Nome ou identificador da empresa inválido' using errcode = '22023';
  end if;

  perform 1
  from public.profiles
  where id = v_user
    and account_type = 'cliente'
    and account_status = 'active'
  for update;
  if not found then
    raise exception 'Apenas contas cliente activas podem criar este perfil' using errcode = '22023';
  end if;

  if exists (select 1 from public.profissionais where user_id = v_user)
     or exists (select 1 from public.companies where user_id = v_user) then
    raise exception 'Esta conta já tem um perfil profissional ou empresarial associado' using errcode = '23505';
  end if;

  insert into public.companies (
    user_id, name, slug, sector, province, city, bairro,
    latitude_aproximada, longitude_aproximada, description,
    phone, whatsapp, email, website, logo_url, nif,
    estado_legalizacao, documento_legalizacao_path, is_approved
  ) values (
    v_user, btrim(v_profile.name), v_profile.slug, v_profile.sector,
    v_profile.province, v_profile.city, v_profile.bairro,
    v_profile.latitude_aproximada, v_profile.longitude_aproximada,
    v_profile.description, v_profile.phone, v_profile.whatsapp,
    v_profile.email, v_profile.website, v_profile.logo_url, v_profile.nif,
    v_profile.estado_legalizacao, v_profile.documento_legalizacao_path, false
  ) returning id into v_profile_id;

  v_request := public.request_account_type_change('empresa', v_profile.name);
  return v_request || jsonb_build_object('profile_id', v_profile_id);
end;
$body$;


create or replace function public.admin_list_account_type_change_requests()
returns table (
  id uuid,
  user_id uuid,
  requested_account_type text,
  display_name text,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
  select r.id, r.user_id, r.requested_account_type, r.display_name, r.requested_at
  from public.account_type_change_requests r
  where r.status = 'pending'
  order by r.requested_at asc;
end;
$$;


create or replace function public.admin_list_account_type_change_history()
returns table (
  id uuid,
  user_id uuid,
  requested_account_type text,
  display_name text,
  requested_at timestamptz,
  status text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  reviewer_name text,
  review_reason text
)
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
  select r.id, r.user_id, r.requested_account_type, r.display_name,
         r.requested_at, r.status, r.reviewed_at, r.reviewed_by,
         coalesce(nullif(btrim(p.nome), ''), r.reviewed_by::text),
         r.review_reason
  from public.account_type_change_requests r
  left join public.profiles p on p.id = r.reviewed_by
  where r.status in ('approved', 'rejected')
  order by r.reviewed_at desc;
end;
$body$;


create or replace function public.admin_review_account_type_change(
  p_request_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_request public.account_type_change_requests%rowtype;
  v_account_type text;
  v_account_status text;
  v_province text;
  v_city text;
  v_profile_id uuid;
  v_slug_base text;
  v_slug text;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  if p_decision is null or p_decision not in ('approve', 'reject') then
    raise exception 'Decisão inválida' using errcode = '22023';
  end if;

  if p_reason is null
     or char_length(btrim(p_reason)) < 10
     or char_length(btrim(p_reason)) > 1000 then
    raise exception 'Indique um motivo entre 10 e 1000 caracteres para aprovar ou rejeitar' using errcode = '22023';
  end if;

  select * into v_request
  from public.account_type_change_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Este pedido já foi avaliado' using errcode = '22023';
  end if;

  if p_decision = 'reject' then
    update public.account_type_change_requests
    set status = 'rejected',
        reviewed_at = now(),
        reviewed_by = v_admin,
        review_reason = btrim(p_reason)
    where id = v_request.id;

    return jsonb_build_object(
      'request_id', v_request.id,
      'status', 'rejected',
      'account_type', 'cliente'
    );
  end if;

  select account_type, account_status, localizacao_provincia, localizacao_municipio
    into v_account_type, v_account_status, v_province, v_city
  from public.profiles
  where id = v_request.user_id
  for update;

  if not found then
    raise exception 'Perfil da conta não encontrado' using errcode = 'P0002';
  end if;

  if v_account_type is distinct from 'cliente' then
    raise exception 'A conta já não está no tipo cliente; o pedido não pode ser aprovado' using errcode = '22023';
  end if;

  if v_account_status is distinct from 'active' then
    raise exception 'A conta precisa de estar activa para ser aprovada' using errcode = '22023';
  end if;

  v_slug_base := lower(regexp_replace(btrim(v_request.display_name), '[^a-z0-9]+', '-', 'gi'));
  v_slug_base := btrim(v_slug_base, '-');
  if v_slug_base = '' then v_slug_base := 'conta'; end if;
  v_slug := left(v_slug_base || '-' || substr(md5(v_request.id::text || clock_timestamp()::text), 1, 8), 190);

  if v_request.requested_account_type = 'profissional' then
    if exists (select 1 from public.companies where user_id = v_request.user_id) then
      raise exception 'A conta tem uma empresa associada e não pode ser aprovada como profissional' using errcode = '22023';
    end if;

    select id into v_profile_id
    from public.profissionais
    where user_id = v_request.user_id
      and estado in ('pendente', 'aprovado')
    for update;

    if not found and exists (
      select 1 from public.profissionais where user_id = v_request.user_id
    ) then
      raise exception 'O perfil profissional associado está rejeitado ou suspenso' using errcode = '22023';
    elsif not found then
      insert into public.profissionais (user_id, nome, slug, estado)
      values (v_request.user_id, v_request.display_name, v_slug, 'pendente')
      returning id into v_profile_id;
    end if;
  else
    if exists (select 1 from public.profissionais where user_id = v_request.user_id) then
      raise exception 'A conta tem um perfil profissional associado e não pode ser aprovada como empresa' using errcode = '22023';
    end if;

    select id into v_profile_id
    from public.companies
    where user_id = v_request.user_id
      and coalesce(estado, 'pendente') in ('pendente', 'aprovado')
    for update;

    if not found and exists (
      select 1 from public.companies where user_id = v_request.user_id
    ) then
      raise exception 'O perfil empresarial associado está rejeitado ou suspenso' using errcode = '22023';
    elsif not found then
      insert into public.companies
        (user_id, name, slug, sector, province, city, is_approved)
      values
        (v_request.user_id, v_request.display_name, v_slug, 'Geral',
         coalesce(nullif(btrim(v_province), ''), 'Não indicada'),
         nullif(btrim(v_city), ''), false)
      returning id into v_profile_id;
    end if;
  end if;

  -- Único ponto deste fluxo que altera o tipo de conta: aprovação administrativa.
  perform set_config('negomapa.self_service_account', 'on', true);
  update public.profiles
  set account_type = v_request.requested_account_type,
      updated_at = now()
  where id = v_request.user_id;

  update public.account_type_change_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_admin,
      review_reason = btrim(p_reason)
  where id = v_request.id;

  return jsonb_build_object(
    'request_id', v_request.id,
    'status', 'approved',
    'account_type', v_request.requested_account_type,
    'profile_id', v_profile_id
  );
end;
$$;

revoke all on function public.request_account_type_change(text, text)
  from public, anon;
revoke all on function public.create_professional_profile_and_request(jsonb)
  from public, anon;
revoke all on function public.create_company_profile_and_request(jsonb)
  from public, anon;
revoke all on function public.admin_list_account_type_change_requests()
  from public, anon;
revoke all on function public.admin_list_account_type_change_history()
  from public, anon;
revoke all on function public.admin_review_account_type_change(uuid, text, text)
  from public, anon;

grant execute on function public.request_account_type_change(text, text)
  to authenticated;
grant execute on function public.create_professional_profile_and_request(jsonb)
  to authenticated;
grant execute on function public.create_company_profile_and_request(jsonb)
  to authenticated;
grant execute on function public.admin_list_account_type_change_requests()
  to authenticated;
grant execute on function public.admin_list_account_type_change_history()
  to authenticated;
grant execute on function public.admin_review_account_type_change(uuid, text, text)
  to authenticated;

-- Remove a RPC de conversão imediata, que alterava account_type sem aprovação.
drop function if exists public.convert_client_account(text, text);

commit;
