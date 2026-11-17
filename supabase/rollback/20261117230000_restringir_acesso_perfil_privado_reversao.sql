begin;
drop trigger if exists guard_companies_managed_fields on public.companies;
drop trigger if exists guard_profissionais_managed_fields on public.profissionais;
drop trigger if exists guard_profiles_managed_fields on public.profiles;
drop function if exists negomapa_private.guard_account_managed_fields();

drop policy if exists companies_update_own on public.companies;
drop policy if exists companies_select_own on public.companies;
create policy auth_select_approved_and_own_companies on public.companies
  for select to authenticated using (is_approved = true or user_id = auth.uid());
create policy auth_update_own_company_not_approved on public.companies
  for update to authenticated
  using (user_id = auth.uid() and (is_approved = false or is_approved is null))
  with check (user_id = auth.uid() and (is_approved = false or is_approved is null));

create policy active_profile_update_required on public.profiles
  for update to authenticated using (negomapa_private.is_account_active(auth.uid()))
  with check (negomapa_private.is_account_active(auth.uid()));
create policy active_account_required on public.profissionais
  for all to authenticated using (negomapa_private.is_account_active(auth.uid()))
  with check (negomapa_private.is_account_active(auth.uid()));
create policy active_owner_authenticated_select on public.profissionais
  for select to authenticated using (is_admin() or negomapa_private.is_account_active(user_id));
create policy active_owner_public_select on public.profissionais
  for select to anon using (negomapa_private.is_account_active(user_id));
create policy active_account_required on public.companies
  for all to authenticated using (negomapa_private.is_account_active(auth.uid()))
  with check (negomapa_private.is_account_active(auth.uid()));
create policy active_owner_authenticated_select on public.companies
  for select to authenticated using (is_admin() or negomapa_private.is_account_active(user_id));
create policy active_owner_public_select on public.companies
  for select to anon using (negomapa_private.is_account_active(user_id));
commit;
