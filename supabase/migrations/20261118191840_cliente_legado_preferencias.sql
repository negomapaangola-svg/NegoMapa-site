begin;

-- O cliente activo mantém as próprias preferências mesmo quando existem
-- registos empresariais/profissionais legados associados à identidade.
-- A autorização continua limitada ao papel cliente, conta activa e auth.uid().
drop policy if exists client_only_preferencias_cliente on public.preferencias_cliente;
create policy client_only_preferencias_cliente on public.preferencias_cliente
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'cliente'
        and p.is_active is true
    )
  )
  with check (
    not (select public.is_admin())
    and user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'cliente'
        and p.is_active is true
    )
  );

commit;
