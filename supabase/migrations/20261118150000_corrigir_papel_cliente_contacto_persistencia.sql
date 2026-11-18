begin;

-- O papel vem de profiles.account_type. Um registo empresarial/profissional
-- legado não deve transformar nem bloquear um cliente que continua cliente.
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
            and exists (
              select 1 from public.profiles profile_role
              where profile_role.id = (select auth.uid())
                and profile_role.account_type = 'profissional'
            )
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
            and exists (
              select 1 from public.profiles profile_role
              where profile_role.id = (select auth.uid())
                and profile_role.account_type = 'empresa'
            )
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
                and exists (
                  select 1 from public.profiles profile_role
                  where profile_role.id = (select auth.uid())
                    and profile_role.account_type = 'profissional'
                )
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
                and exists (
                  select 1 from public.profiles profile_role
                  where profile_role.id = (select auth.uid())
                    and profile_role.account_type = 'empresa'
                )
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
                and exists (
                  select 1 from public.profiles profile_role
                  where profile_role.id = (select auth.uid())
                    and profile_role.account_type = 'profissional'
                )
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
                and exists (
                  select 1 from public.profiles profile_role
                  where profile_role.id = (select auth.uid())
                    and profile_role.account_type = 'empresa'
                )
            )
          )
        )
    )
  );

-- Defesa fail-closed: a migração não activa/desactiva RLS e aborta se alguma
-- das tabelas protegidas deixar de ter RLS activo.
do $guard$
declare t text;
begin
  foreach t in array array[
    'profiles','companies','profissionais','candidaturas','vagas','servicos',
    'produtos','admin_users','pedidos_servico','conversas','mensagens',
    'avaliacoes','preferencias_cliente','conta_detalhes',
    'preferencias_notificacao','notificacoes'
  ] loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;
end;
$guard$;

commit;
