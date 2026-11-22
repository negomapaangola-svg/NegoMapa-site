begin;

-- Restaura as políticas anteriores da migração 20261118060000.

drop policy if exists client_only_insert_conversas on public.conversas;
create policy client_only_insert_conversas on public.conversas
  as restrictive for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'cliente'
        and p.is_active is true
    )
    and not (select public.is_admin())
    and not exists (
      select 1 from public.profissionais pr
      where pr.user_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.companies c
      where c.user_id = (select auth.uid())
    )
  );

drop policy if exists active_role_conversation_access on public.conversas;
create policy active_role_conversation_access on public.conversas
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and (
      (
        cliente_id = (select auth.uid())
        and exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.account_type = 'cliente'
            and p.is_active is true
        )
        and not exists (
          select 1 from public.profissionais pr
          where pr.user_id = (select auth.uid())
        )
        and not exists (
          select 1 from public.companies c
          where c.user_id = (select auth.uid())
        )
      )
      or
      (
        profissional_id is not null
        and exists (
          select 1 from public.profissionais p
          where p.id = conversas.profissional_id
            and p.user_id = (select auth.uid())
            and p.estado = 'aprovado'
            and negomapa_private.is_account_active(p.user_id)
        )
      )
      or
      (
        empresa_id is not null
        and exists (
          select 1 from public.companies c
          where c.id = conversas.empresa_id
            and c.user_id = (select auth.uid())
            and c.is_approved is true
            and coalesce(c.estado, 'aprovado') = 'aprovado'
            and negomapa_private.is_account_active(c.user_id)
        )
      )
    )
  )
  with check (
    not (select public.is_admin())
    and cliente_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'cliente'
        and p.is_active is true
    )
    and not exists (
      select 1 from public.profissionais pr
      where pr.user_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.companies c
      where c.user_id = (select auth.uid())
    )
  );

drop policy if exists active_role_message_access on public.mensagens;
create policy active_role_message_access on public.mensagens
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and exists (
      select 1 from public.conversas cv
      where cv.id = mensagens.conversa_id
        and (
          (
            cv.cliente_id = (select auth.uid())
            and exists (
              select 1 from public.profiles p
              where p.id = (select auth.uid())
                and p.account_type = 'cliente'
                and p.is_active is true
            )
            and not exists (
              select 1 from public.profissionais pr
              where pr.user_id = (select auth.uid())
            )
            and not exists (
              select 1 from public.companies c
              where c.user_id = (select auth.uid())
            )
          )
          or
          (
            cv.profissional_id is not null
            and exists (
              select 1 from public.profissionais p
              where p.id = cv.profissional_id
                and p.user_id = (select auth.uid())
                and p.estado = 'aprovado'
                and negomapa_private.is_account_active(p.user_id)
            )
          )
          or
          (
            cv.empresa_id is not null
            and exists (
              select 1 from public.companies c
              where c.id = cv.empresa_id
                and c.user_id = (select auth.uid())
                and c.is_approved is true
                and coalesce(c.estado, 'aprovado') = 'aprovado'
                and negomapa_private.is_account_active(c.user_id)
            )
          )
        )
    )
  )
  with check (
    not (select public.is_admin())
    and exists (
      select 1 from public.conversas cv
      where cv.id = mensagens.conversa_id
        and (
          (
            cv.cliente_id = (select auth.uid())
            and exists (
              select 1 from public.profiles p
              where p.id = (select auth.uid())
                and p.account_type = 'cliente'
                and p.is_active is true
            )
            and not exists (
              select 1 from public.profissionais pr
              where pr.user_id = (select auth.uid())
            )
            and not exists (
              select 1 from public.companies c
              where c.user_id = (select auth.uid())
            )
          )
          or
          (
            cv.profissional_id is not null
            and exists (
              select 1 from public.profissionais p
              where p.id = cv.profissional_id
                and p.user_id = (select auth.uid())
                and p.estado = 'aprovado'
                and negomapa_private.is_account_active(p.user_id)
            )
          )
          or
          (
            cv.empresa_id is not null
            and exists (
              select 1 from public.companies c
              where c.id = cv.empresa_id
                and c.user_id = (select auth.uid())
                and c.is_approved is true
                and coalesce(c.estado, 'aprovado') = 'aprovado'
                and negomapa_private.is_account_active(c.user_id)
            )
          )
        )
    )
  );

-- Reverte apenas os privilégios concedidos por esta migração.
revoke select on public.companies, public.profissionais from authenticated;

commit;
