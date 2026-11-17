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
commit;