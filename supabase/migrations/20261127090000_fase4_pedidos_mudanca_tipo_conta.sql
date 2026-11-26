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
    review_reason is null or char_length(review_reason) <= 1000
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
revoke all on public.account_type_change_requests from public, anon, authenticated;

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

  if p_requested_type not in ('profissional', 'empresa') then
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

  if p_decision not in ('approve', 'reject') then
    raise exception 'Decisão inválida' using errcode = '22023';
  end if;

  if p_decision = 'reject'
     and (p_reason is null or char_length(btrim(p_reason)) < 10) then
    raise exception 'Indique um motivo de rejeição com pelo menos 10 caracteres' using errcode = '22023';
  end if;

  if p_reason is not null and char_length(p_reason) > 1000 then
    raise exception 'O motivo não pode exceder 1000 caracteres' using errcode = '22023';
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
    for update;

    if not found then
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
    for update;

    if not found then
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
  update public.profiles
  set account_type = v_request.requested_account_type,
      updated_at = now()
  where id = v_request.user_id;

  update public.account_type_change_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_admin,
      review_reason = nullif(btrim(coalesce(p_reason, '')), '')
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
revoke all on function public.admin_list_account_type_change_requests()
  from public, anon;
revoke all on function public.admin_review_account_type_change(uuid, text, text)
  from public, anon;

grant execute on function public.request_account_type_change(text, text)
  to authenticated;
grant execute on function public.admin_list_account_type_change_requests()
  to authenticated;
grant execute on function public.admin_review_account_type_change(uuid, text, text)
  to authenticated;

-- Remove a RPC de conversão imediata, que alterava account_type sem aprovação.
drop function if exists public.convert_client_account(text, text);

commit;
