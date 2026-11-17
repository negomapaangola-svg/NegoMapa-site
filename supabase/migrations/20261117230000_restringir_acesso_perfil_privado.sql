begin;

-- Remove permissive policies that allowed authenticated users to see/update rows
-- belonging to other active accounts, and anon users to see unapproved profiles.
drop policy if exists active_profile_update_required on public.profiles;

drop policy if exists active_account_required on public.profissionais;
drop policy if exists active_owner_authenticated_select on public.profissionais;
drop policy if exists active_owner_public_select on public.profissionais;

drop policy if exists active_account_required on public.companies;
drop policy if exists active_owner_authenticated_select on public.companies;
drop policy if exists active_owner_public_select on public.companies;
drop policy if exists auth_select_approved_and_own_companies on public.companies;
drop policy if exists auth_update_own_company_not_approved on public.companies;

-- The remaining explicit policies already constrain profile and professional
-- reads/writes to the owner, admins, or approved public records.
-- Companies: owners can read only their own private row and update operational data,
-- including after approval. Approved public data remains exposed through approved-only policies/views.
create policy companies_select_own on public.companies
  for select to authenticated using (user_id = (select auth.uid()));
create policy companies_update_own on public.companies
  for update to authenticated
  using (user_id = (select auth.uid()) and negomapa_private.is_account_active((select auth.uid())))
  with check (user_id = (select auth.uid()) and negomapa_private.is_account_active((select auth.uid())));

-- Prevent owners from changing moderation, legal identity, ownership or audit fields.
create or replace function negomapa_private.guard_account_managed_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    if tg_table_name = 'companies' then
      if new.id is distinct from old.id
        or new.user_id is distinct from old.user_id
        or new.slug is distinct from old.slug
        or new.email is distinct from old.email
        or new.is_verified is distinct from old.is_verified
        or new.is_approved is distinct from old.is_approved
        or new.nif is distinct from old.nif
        or new.estado_legalizacao is distinct from old.estado_legalizacao
        or new.documento_legalizacao_url is distinct from old.documento_legalizacao_url
        or new.documento_legalizacao_path is distinct from old.documento_legalizacao_path
        or new.documents_url is distinct from old.documents_url
        or new.estado is distinct from old.estado
        or new.motivo_decisao is distinct from old.motivo_decisao
        or new.decidido_em is distinct from old.decidido_em
        or new.decidido_por is distinct from old.decidido_por
        or new.created_at is distinct from old.created_at then
        raise exception 'Campos de aprovação, legais e de propriedade só podem ser alterados pela administração'
          using errcode = '42501';
      end if;
    elsif tg_table_name = 'profissionais' then
      if new.id is distinct from old.id
        or new.user_id is distinct from old.user_id
        or new.slug is distinct from old.slug
        or new.estado is distinct from old.estado
        or new.motivo_rejeicao is distinct from old.motivo_rejeicao
        or new.avaliado_em is distinct from old.avaliado_em
        or new.avaliado_por is distinct from old.avaliado_por
        or new.bi_numero is distinct from old.bi_numero
        or new.bi_foto_path is distinct from old.bi_foto_path
        or new.created_at is distinct from old.created_at then
        raise exception 'Campos de aprovação, identificação e propriedade só podem ser alterados pela administração'
          using errcode = '42501';
      end if;
    elsif tg_table_name = 'profiles' then
      if new.id is distinct from old.id
        or new.is_admin is distinct from old.is_admin
        or new.account_type is distinct from old.account_type
        or new.is_active is distinct from old.is_active
        or new.deleted_at is distinct from old.deleted_at
        or new.deleted_by is distinct from old.deleted_by
        or new.deletion_reason is distinct from old.deletion_reason
        or new.created_at is distinct from old.created_at then
        raise exception 'Campos de função, estado e eliminação só podem ser alterados pela administração'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_companies_managed_fields on public.companies;
create trigger guard_companies_managed_fields before update on public.companies
  for each row execute function negomapa_private.guard_account_managed_fields();

drop trigger if exists guard_profissionais_managed_fields on public.profissionais;
create trigger guard_profissionais_managed_fields before update on public.profissionais
  for each row execute function negomapa_private.guard_account_managed_fields();

drop trigger if exists guard_profiles_managed_fields on public.profiles;
create trigger guard_profiles_managed_fields before update on public.profiles
  for each row execute function negomapa_private.guard_account_managed_fields();

commit;
