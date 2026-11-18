begin;
create or replace function negomapa_private.block_admin_email_reuse() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null and exists (select 1 from public.admin_users au join auth.users admin_auth on admin_auth.id = au.user_id where lower(admin_auth.email) = lower(new.email) and admin_auth.id is distinct from new.id) then
    raise exception 'Este endereço de email está reservado a uma conta administrativa.' using errcode = '23505';
  end if; return new;
end; $$;
drop trigger if exists block_admin_email_reuse on auth.users;
create trigger block_admin_email_reuse before insert or update of email on auth.users for each row execute function negomapa_private.block_admin_email_reuse();
create or replace function negomapa_private.block_admin_account_type() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.account_type is not null and exists (select 1 from public.admin_users au where au.user_id = new.id) then
    raise exception 'Uma conta administrativa não pode assumir um papel de cliente, profissional ou empresa.' using errcode = '42501';
  end if; return new;
end; $$;
drop trigger if exists block_admin_account_type on public.profiles;
create trigger block_admin_account_type before insert or update of account_type on public.profiles for each row execute function negomapa_private.block_admin_account_type();
drop policy if exists admin_cannot_insert_companies on public.companies;
create policy admin_cannot_insert_companies on public.companies as restrictive for insert to authenticated with check (not (select public.is_admin()));
drop policy if exists admin_cannot_insert_profissionais on public.profissionais;
create policy admin_cannot_insert_profissionais on public.profissionais as restrictive for insert to authenticated with check (not (select public.is_admin()));
drop policy if exists admin_cannot_insert_servicos on public.servicos;
create policy admin_cannot_insert_servicos on public.servicos as restrictive for insert to authenticated with check (not (select public.is_admin()));
drop policy if exists admin_cannot_insert_produtos on public.produtos;
create policy admin_cannot_insert_produtos on public.produtos as restrictive for insert to authenticated with check (not (select public.is_admin()));
drop policy if exists admin_cannot_insert_vagas on public.vagas;
create policy admin_cannot_insert_vagas on public.vagas as restrictive for insert to authenticated with check (not (select public.is_admin()));
drop policy if exists only_clients_can_apply on public.candidaturas;
create policy only_clients_can_apply on public.candidaturas as restrictive for insert to authenticated with check (not (select public.is_admin()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_type = 'cliente' and p.is_active is true)
    and not exists (select 1 from public.companies c where c.user_id = (select auth.uid()))
    and not exists (select 1 from public.profissionais pr where pr.user_id = (select auth.uid())));

-- Fail closed if a target table has lost RLS. This migration never toggles RLS.
do $guard$
declare t text;
begin
  foreach t in array array['profiles','companies','profissionais','candidaturas','vagas','servicos','produtos','admin_users'] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;
end;
$guard$;

-- Active account required for company/professional owners on all authenticated
-- operations. Existing public/anonymous read policies are unaffected.
drop policy if exists active_account_required on public.companies;
create policy active_account_required on public.companies
  as restrictive for all to authenticated
  using (negomapa_private.is_account_active((select auth.uid())))
  with check (negomapa_private.is_account_active((select auth.uid())));

drop policy if exists active_account_required on public.profissionais;
create policy active_account_required on public.profissionais
  as restrictive for all to authenticated
  using (negomapa_private.is_account_active((select auth.uid())))
  with check (negomapa_private.is_account_active((select auth.uid())));

-- New company/professional profiles can only be created by an active client
-- with no existing business/professional identity.
drop policy if exists client_only_insert_companies on public.companies;
create policy client_only_insert_companies on public.companies
  as restrictive for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not (select public.is_admin())
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );

drop policy if exists client_only_insert_profissionais on public.profissionais;
create policy client_only_insert_profissionais on public.profissionais
  as restrictive for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not (select public.is_admin())
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
  );

-- Pending/suspended owners cannot publish through direct PostgREST INSERTs.
drop policy if exists approved_owner_insert_servicos on public.servicos;
create policy approved_owner_insert_servicos on public.servicos
  as restrictive for insert to authenticated
  with check (
    not (select public.is_admin())
    and (
      (company_id is not null and exists (
        select 1 from public.companies c where c.id=company_id and c.user_id=(select auth.uid())
          and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
          and negomapa_private.is_account_active(c.user_id)
      ))
      or
      (profissional_id is not null and exists (
        select 1 from public.profissionais p where p.id=profissional_id and p.user_id=(select auth.uid())
          and p.estado='aprovado' and negomapa_private.is_account_active(p.user_id)
      ))
    )
  );

drop policy if exists approved_company_insert_produtos on public.produtos;
create policy approved_company_insert_produtos on public.produtos
  as restrictive for insert to authenticated
  with check (
    not (select public.is_admin())
    and exists (
      select 1 from public.companies c where c.id=company_id and c.user_id=(select auth.uid())
        and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
        and negomapa_private.is_account_active(c.user_id)
    )
  );

drop policy if exists approved_company_insert_vagas on public.vagas;
create policy approved_company_insert_vagas on public.vagas
  as restrictive for insert to authenticated
  with check (
    not (select public.is_admin())
    and exists (
      select 1 from public.companies c where c.id=company_id and c.user_id=(select auth.uid())
        and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
        and negomapa_private.is_account_active(c.user_id)
    )
  );

-- Trigger functions are invoked by PostgreSQL triggers, not exposed as RPCs.
revoke all on function negomapa_private.block_admin_email_reuse() from public, anon, authenticated;
revoke all on function negomapa_private.block_admin_account_type() from public, anon, authenticated;

-- Customer service requests are a client capability, not a second persona for
-- professional/company/admin identities.
drop policy if exists client_only_insert_pedidos_servico on public.pedidos_servico;
create policy client_only_insert_pedidos_servico on public.pedidos_servico
  as restrictive for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not (select public.is_admin())
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );

drop policy if exists client_only_update_pedidos_servico on public.pedidos_servico;
create policy client_only_update_pedidos_servico on public.pedidos_servico
  as restrictive for update to authenticated
  using (
    cliente_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not (select public.is_admin())
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
    or (not (select public.is_admin()) and profissional_id = (select public.profissional_aprovado_id()))
  )
  with check (
    (cliente_id = (select auth.uid())
      and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
      and not (select public.is_admin())
      and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
      and not exists (select 1 from public.companies c where c.user_id=(select auth.uid())))
    or (not (select public.is_admin()) and profissional_id = (select public.profissional_aprovado_id()))
  );

drop policy if exists client_only_select_pedidos_servico on public.pedidos_servico;
create policy client_only_select_pedidos_servico on public.pedidos_servico
  as restrictive for select to authenticated
  using (
    (cliente_id <> (select auth.uid()) or (
      exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
      and not (select public.is_admin())
      and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
      and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
    ))
    or (not (select public.is_admin()) and profissional_id = (select public.profissional_aprovado_id()))
    or (select public.is_admin())
  );

drop policy if exists client_only_insert_conversas on public.conversas;
create policy client_only_insert_conversas on public.conversas
  as restrictive for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not (select public.is_admin())
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );


-- Administrators may moderate other users' records, but cannot operate legacy
-- company/professional profiles or their own listings as a business account.
drop policy if exists admin_cannot_update_own_company on public.companies;
create policy admin_cannot_update_own_company on public.companies
  as restrictive for update to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()))
  with check (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

drop policy if exists admin_cannot_delete_own_company on public.companies;
create policy admin_cannot_delete_own_company on public.companies
  as restrictive for delete to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

drop policy if exists admin_cannot_update_own_profissional on public.profissionais;
create policy admin_cannot_update_own_profissional on public.profissionais
  as restrictive for update to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()))
  with check (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

drop policy if exists admin_cannot_delete_own_profissional on public.profissionais;
create policy admin_cannot_delete_own_profissional on public.profissionais
  as restrictive for delete to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

drop policy if exists admin_cannot_update_own_vagas on public.vagas;
create policy admin_cannot_update_own_vagas on public.vagas
  as restrictive for update to authenticated
  using (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=vagas.company_id and c.user_id=(select auth.uid())))
  with check (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=vagas.company_id and c.user_id=(select auth.uid())));

drop policy if exists admin_cannot_delete_own_vagas on public.vagas;
create policy admin_cannot_delete_own_vagas on public.vagas
  as restrictive for delete to authenticated
  using (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=vagas.company_id and c.user_id=(select auth.uid())));

drop policy if exists admin_cannot_update_own_produtos on public.produtos;
create policy admin_cannot_update_own_produtos on public.produtos
  as restrictive for update to authenticated
  using (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=produtos.company_id and c.user_id=(select auth.uid())))
  with check (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=produtos.company_id and c.user_id=(select auth.uid())));

drop policy if exists admin_cannot_delete_own_produtos on public.produtos;
create policy admin_cannot_delete_own_produtos on public.produtos
  as restrictive for delete to authenticated
  using (not (select public.is_admin()) or not exists (select 1 from public.companies c where c.id=produtos.company_id and c.user_id=(select auth.uid())));

drop policy if exists admin_cannot_update_own_servicos on public.servicos;
create policy admin_cannot_update_own_servicos on public.servicos
  as restrictive for update to authenticated
  using (
    not (select public.is_admin())
    or (
      not exists (select 1 from public.companies c where c.id=servicos.company_id and c.user_id=(select auth.uid()))
      and not exists (select 1 from public.profissionais p where p.id=servicos.profissional_id and p.user_id=(select auth.uid()))
    )
  )
  with check (
    not (select public.is_admin())
    or (
      not exists (select 1 from public.companies c where c.id=servicos.company_id and c.user_id=(select auth.uid()))
      and not exists (select 1 from public.profissionais p where p.id=servicos.profissional_id and p.user_id=(select auth.uid()))
    )
  );

drop policy if exists admin_cannot_delete_own_servicos on public.servicos;
create policy admin_cannot_delete_own_servicos on public.servicos
  as restrictive for delete to authenticated
  using (
    not (select public.is_admin())
    or (
      not exists (select 1 from public.companies c where c.id=servicos.company_id and c.user_id=(select auth.uid()))
      and not exists (select 1 from public.profissionais p where p.id=servicos.profissional_id and p.user_id=(select auth.uid()))
    )
  );

-- Admin messaging is isolated in admin_messages; the user-to-user inbox is
-- not available to an administrative identity, even if legacy owner rows exist.
drop policy if exists admin_cannot_use_user_conversations on public.conversas;
create policy admin_cannot_use_user_conversations on public.conversas
  as restrictive for all to authenticated
  using (not (select public.is_admin()))
  with check (not (select public.is_admin()));

drop policy if exists admin_cannot_use_user_messages on public.mensagens;
create policy admin_cannot_use_user_messages on public.mensagens
  as restrictive for all to authenticated
  using (not (select public.is_admin()))
  with check (not (select public.is_admin()));


-- Candidate and employer access is state-aware, including pending/suspended owners.
drop policy if exists role_scoped_candidaturas_select on public.candidaturas;
create policy role_scoped_candidaturas_select on public.candidaturas
  as restrictive for select to authenticated
  using (
    (select public.is_admin())
    or (
      user_id = (select auth.uid())
      and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
      and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
      and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    )
    or (
      empresa_dona_da_vaga(vaga_id)
      and exists (
        select 1 from public.vagas v join public.companies c on c.id=v.company_id
        where v.id=candidaturas.vaga_id and c.user_id=(select auth.uid())
          and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
          and negomapa_private.is_account_active(c.user_id)
      )
    )
  );

drop policy if exists approved_company_update_candidaturas on public.candidaturas;
create policy approved_company_update_candidaturas on public.candidaturas
  as restrictive for update to authenticated
  using (
    (select public.is_admin())
    or (
      empresa_dona_da_vaga(vaga_id)
      and exists (
        select 1 from public.vagas v join public.companies c on c.id=v.company_id
        where v.id=candidaturas.vaga_id and c.user_id=(select auth.uid())
          and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
          and negomapa_private.is_account_active(c.user_id)
      )
    )
  )
  with check (
    (select public.is_admin())
    or (
      empresa_dona_da_vaga(vaga_id)
      and exists (
        select 1 from public.vagas v join public.companies c on c.id=v.company_id
        where v.id=candidaturas.vaga_id and c.user_id=(select auth.uid())
          and c.is_approved is true and coalesce(c.estado,'aprovado')='aprovado'
          and negomapa_private.is_account_active(c.user_id)
      )
    )
  );

-- User-to-user conversations require an active client or an approved,
-- active professional/company owner. Pending/suspended providers lose access.
drop policy if exists active_role_conversation_access on public.conversas;
create policy active_role_conversation_access on public.conversas
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and (
      (cliente_id=(select auth.uid())
        and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
        and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
        and not exists (select 1 from public.companies c where c.user_id=(select auth.uid())))
      or
      (profissional_id is not null and exists (
        select 1 from public.profissionais p where p.id=conversas.profissional_id
          and p.user_id=(select auth.uid()) and p.estado='aprovado'
          and negomapa_private.is_account_active(p.user_id)
      ))
      or
      (empresa_id is not null and exists (
        select 1 from public.companies c where c.id=conversas.empresa_id
          and c.user_id=(select auth.uid()) and c.is_approved is true
          and coalesce(c.estado,'aprovado')='aprovado'
          and negomapa_private.is_account_active(c.user_id)
      ))
    )
  )
  with check (
    not (select public.is_admin())
    and cliente_id=(select auth.uid())
    and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
    and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
    and not exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );

drop policy if exists active_role_message_access on public.mensagens;
create policy active_role_message_access on public.mensagens
  as restrictive for all to authenticated
  using (
    not (select public.is_admin())
    and exists (
      select 1 from public.conversas cv
      where cv.id=mensagens.conversa_id
        and (
          (cv.cliente_id=(select auth.uid())
            and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
            and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
            and not exists (select 1 from public.companies c where c.user_id=(select auth.uid())))
          or (cv.profissional_id is not null and exists (
            select 1 from public.profissionais p where p.id=cv.profissional_id
              and p.user_id=(select auth.uid()) and p.estado='aprovado'
              and negomapa_private.is_account_active(p.user_id)
          ))
          or (cv.empresa_id is not null and exists (
            select 1 from public.companies c where c.id=cv.empresa_id
              and c.user_id=(select auth.uid()) and c.is_approved is true
              and coalesce(c.estado,'aprovado')='aprovado'
              and negomapa_private.is_account_active(c.user_id)
          ))
        )
    )
  )
  with check (
    not (select public.is_admin())
    and exists (
      select 1 from public.conversas cv
      where cv.id=mensagens.conversa_id
        and (
          (cv.cliente_id=(select auth.uid())
            and exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='cliente' and p.is_active is true)
            and not exists (select 1 from public.profissionais pr where pr.user_id=(select auth.uid()))
            and not exists (select 1 from public.companies c where c.user_id=(select auth.uid())))
          or (cv.profissional_id is not null and exists (
            select 1 from public.profissionais p where p.id=cv.profissional_id
              and p.user_id=(select auth.uid()) and p.estado='aprovado'
              and negomapa_private.is_account_active(p.user_id)
          ))
          or (cv.empresa_id is not null and exists (
            select 1 from public.companies c where c.id=cv.empresa_id
              and c.user_id=(select auth.uid()) and c.is_approved is true
              and coalesce(c.estado,'aprovado')='aprovado'
              and negomapa_private.is_account_active(c.user_id)
          ))
        )
    )
  );


drop policy if exists admin_cannot_insert_avaliacoes on public.avaliacoes;
create policy admin_cannot_insert_avaliacoes on public.avaliacoes
  as restrictive for insert to authenticated
  with check (not (select public.is_admin()));

drop policy if exists admin_cannot_update_own_avaliacoes on public.avaliacoes;
create policy admin_cannot_update_own_avaliacoes on public.avaliacoes
  as restrictive for update to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()))
  with check (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

drop policy if exists admin_cannot_delete_own_avaliacoes on public.avaliacoes;
create policy admin_cannot_delete_own_avaliacoes on public.avaliacoes
  as restrictive for delete to authenticated
  using (not (select public.is_admin()) or user_id is distinct from (select auth.uid()));

commit;