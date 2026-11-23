-- Fase 1: base para desativação, suspensão, reativação, restauração e eliminação de contas.
-- Não altera migrações anteriores.

begin;

alter table public.profiles
  add column if not exists account_status text
    not null default 'active'
    check (account_status in ('active', 'deactivated', 'suspended', 'pending_deletion', 'deleted')),
  add column if not exists deactivated_at timestamptz,
  add column if not exists deletion_requested_at timestamptz;

update public.profiles
set account_status = 'suspended',
    deactivated_at = coalesce(deactivated_at, deleted_at, now())
where is_active is false
  and account_status = 'active';

create or replace function negomapa_private.sync_account_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.is_active := (new.account_status = 'active');

  if new.account_status = 'deactivated' then
    new.deactivated_at := coalesce(new.deactivated_at, now());
  elsif new.account_status = 'active' then
    new.deactivated_at := null;
    new.deletion_requested_at := null;
    new.deleted_at := null;
  elsif new.account_status = 'pending_deletion' then
    new.deletion_requested_at := coalesce(new.deletion_requested_at, now());
  elsif new.account_status = 'deleted' then
    new.deleted_at := coalesce(new.deleted_at, now());
  end if;

  return new;
end;
$$;

revoke all on function negomapa_private.sync_account_status() from public, anon, authenticated;

drop trigger if exists sync_account_status_on_profiles on public.profiles;
create trigger sync_account_status_on_profiles
before insert or update of account_status on public.profiles
for each row execute function negomapa_private.sync_account_status();

create table if not exists public.account_status_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  target_id uuid not null references auth.users(id),
  action text not null check (action in ('deactivate', 'reactivate', 'suspend', 'restore', 'request_deletion', 'confirm_deletion')),
  previous_status text not null,
  new_status text not null,
  reason text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists account_status_audit_target_idx
  on public.account_status_audit (target_id, occurred_at desc);
create index if not exists account_status_audit_actor_idx
  on public.account_status_audit (actor_id, occurred_at desc);

alter table public.account_status_audit enable row level security;

revoke all on public.account_status_audit from public, anon, authenticated;
grant select on public.account_status_audit to authenticated;

drop policy if exists account_status_audit_owner_or_admin_read on public.account_status_audit;
create policy account_status_audit_owner_or_admin_read
on public.account_status_audit
for select to authenticated
using (actor_id = auth.uid() or target_id = auth.uid() or public.is_admin());

create or replace function public.protect_profile_deletion_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and auth.uid() = old.id
     and not public.is_admin()
     and coalesce(current_setting('negomapa.self_service_account', true), 'off') <> 'on' then
    new.is_active := old.is_active;
    new.account_status := old.account_status;
    new.deactivated_at := old.deactivated_at;
    new.deletion_requested_at := old.deletion_requested_at;
    new.deleted_at := old.deleted_at;
    new.deleted_by := old.deleted_by;
    new.deletion_reason := old.deletion_reason;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_deletion_fields() from public, anon, authenticated;

drop trigger if exists protect_profile_deletion_fields on public.profiles;
create trigger protect_profile_deletion_fields
before update on public.profiles
for each row execute function public.protect_profile_deletion_fields();

create or replace function negomapa_private.record_account_status_action(
  p_actor uuid,
  p_target uuid,
  p_action text,
  p_previous text,
  p_new text,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_status_audit
    (actor_id, target_id, action, previous_status, new_status, reason, metadata)
  values
    (p_actor, p_target, p_action, p_previous, p_new, p_reason, p_metadata);
end;
$$;

revoke all on function negomapa_private.record_account_status_action(uuid, uuid, text, text, text, text, jsonb)
  from public, anon, authenticated;

create or replace function negomapa_private.change_account_status(
  p_target uuid,
  p_action text,
  p_reason text default null,
  p_confirmation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_previous text;
  v_new text;
begin
  if v_actor is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  if v_actor <> p_target and not public.is_admin() then
    raise exception 'Só pode alterar a sua própria conta' using errcode = '42501';
  end if;

  select account_status into v_previous
  from public.profiles
  where id = p_target
  for update;

  if not found then
    raise exception 'Conta não encontrada' using errcode = 'P0002';
  end if;

  if v_previous = 'deleted' then
    raise exception 'Uma conta eliminada não pode ser restaurada ou alterada' using errcode = '22023';
  end if;

  case p_action
    when 'deactivate' then
      if v_previous <> 'active' then
        raise exception 'Apenas contas activas podem ser desactivadas' using errcode = '22023';
      end if;
      v_new := 'deactivated';
    when 'reactivate' then
      if v_previous <> 'deactivated' then
        raise exception 'Apenas contas desactivadas podem ser reactivadas' using errcode = '22023';
      end if;
      v_new := 'active';
    when 'suspend' then
      if v_previous not in ('active', 'deactivated') then
        raise exception 'Esta conta não pode ser suspensa neste estado' using errcode = '22023';
      end if;
      if p_reason is null or char_length(btrim(p_reason)) < 10 then
        raise exception 'Indique um motivo com pelo menos 10 caracteres' using errcode = '22023';
      end if;
      v_new := 'suspended';
    when 'restore' then
      if v_previous not in ('deactivated', 'suspended') then
        raise exception 'Apenas contas desactivadas ou suspensas podem ser restauradas' using errcode = '22023';
      end if;
      v_new := 'active';
    when 'request_deletion' then
      if v_previous not in ('active', 'deactivated', 'suspended') then
        raise exception 'Esta conta não pode pedir eliminação neste estado' using errcode = '22023';
      end if;
      v_new := 'pending_deletion';
    when 'confirm_deletion' then
      if v_previous <> 'pending_deletion' then
        raise exception 'É necessário pedir a eliminação antes de a confirmar' using errcode = '22023';
      end if;
      if p_confirmation is distinct from 'ELIMINAR' then
        raise exception 'Confirmação inválida' using errcode = '22023';
      end if;
      v_new := 'deleted';
    else
      raise exception 'Acção inválida' using errcode = '22023';
  end case;

  perform set_config('negomapa.self_service_account', 'on', true);

  update public.profiles
  set account_status = v_new,
      deleted_by = case when v_new = 'deleted' then v_actor else deleted_by end,
      deletion_reason = case when p_reason is not null then btrim(p_reason) else deletion_reason end,
      updated_at = now()
  where id = p_target;

  perform negomapa_private.record_account_status_action(
    v_actor, p_target, p_action, v_previous, v_new, p_reason
  );

  return jsonb_build_object('status', v_new);
end;
$$;

revoke all on function negomapa_private.change_account_status(uuid, text, text, text)
  from public, anon, authenticated;

create or replace function public.deactivate_own_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'deactivate');
end;
$$;

create or replace function public.reactivate_own_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'reactivate');
end;
$$;

create or replace function public.suspend_own_account(p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'suspend', p_reason);
end;
$$;

create or replace function public.restore_own_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'restore');
end;
$$;

create or replace function public.request_delete_own_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'request_deletion');
end;
$$;

create or replace function public.confirm_delete_own_account(p_confirmation text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return negomapa_private.change_account_status(auth.uid(), 'confirm_deletion', null, p_confirmation);
end;
$$;

create or replace function public.admin_change_account_status(
  p_account_id uuid,
  p_action text,
  p_reason text default null,
  p_confirmation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return negomapa_private.change_account_status(p_account_id, p_action, p_reason, p_confirmation);
end;
$$;

revoke all on function public.deactivate_own_account() from public, anon;
revoke all on function public.reactivate_own_account() from public, anon;
revoke all on function public.suspend_own_account(text) from public, anon;
revoke all on function public.restore_own_account() from public, anon;
revoke all on function public.request_delete_own_account() from public, anon;
revoke all on function public.confirm_delete_own_account(text) from public, anon;
revoke all on function public.admin_change_account_status(uuid, text, text, text) from public, anon;

grant execute on function public.deactivate_own_account() to authenticated;
grant execute on function public.reactivate_own_account() to authenticated;
grant execute on function public.suspend_own_account(text) to authenticated;
grant execute on function public.restore_own_account() to authenticated;
grant execute on function public.request_delete_own_account() to authenticated;
grant execute on function public.confirm_delete_own_account(text) to authenticated;
grant execute on function public.admin_change_account_status(uuid, text, text, text) to authenticated;

commit;