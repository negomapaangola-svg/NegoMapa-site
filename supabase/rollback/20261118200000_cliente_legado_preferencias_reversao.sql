begin;

-- Restaura exactamente a política anterior desta tabela.
drop policy if exists client_only_preferencias_cliente on public.preferencias_cliente;
create policy client_only_preferencias_cliente on public.preferencias_cliente
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  )
  with check (
    not (select public.is_admin())
    and user_id=(select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );

commit;
