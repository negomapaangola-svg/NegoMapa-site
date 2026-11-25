-- Eliminação permanente e completa da conta própria.
-- Mantém avaliações e auditoria; não altera RLS nem políticas de leitura pública.
begin;

alter table public.avaliacoes alter column user_id drop not null;
alter table public.avaliacoes drop constraint if exists avaliacoes_user_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.avaliacoes drop constraint if exists avaliacoes_company_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_company_id_fkey foreign key (company_id) references public.companies(id) on delete set null;
alter table public.avaliacoes drop constraint if exists avaliacoes_profissional_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_profissional_id_fkey foreign key (profissional_id) references public.profissionais(id) on delete set null;
alter table public.avaliacoes drop constraint if exists avaliacoes_servico_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_servico_id_fkey foreign key (servico_id) references public.servicos(id) on delete set null;
alter table public.avaliacoes drop constraint if exists avaliacoes_vaga_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_vaga_id_fkey foreign key (vaga_id) references public.vagas(id) on delete set null;

alter table public.account_status_audit alter column actor_id drop not null, alter column target_id drop not null;
alter table public.account_status_audit drop constraint if exists account_status_audit_actor_id_fkey;
alter table public.account_status_audit add constraint account_status_audit_actor_id_fkey foreign key (actor_id) references auth.users(id) on delete set null;
alter table public.account_status_audit drop constraint if exists account_status_audit_target_id_fkey;
alter table public.account_status_audit add constraint account_status_audit_target_id_fkey foreign key (target_id) references auth.users(id) on delete set null;

create or replace function public.get_own_account_deletion_storage_manifest()
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_professional_ids uuid[] := array[]::uuid[];
  v_company_ids uuid[] := array[]::uuid[];
  v_service_ids uuid[] := array[]::uuid[];
  v_product_ids uuid[] := array[]::uuid[];
  v_vacancy_ids uuid[] := array[]::uuid[];
  v_conversation_ids uuid[] := array[]::uuid[];
  v_prefixes text[];
  v_objects jsonb;
begin
  if v_user is null or exists (select 1 from public.admin_users a where a.user_id = v_user) then
    raise exception 'Conta inválida para eliminação própria' using errcode = '42501';
  end if;
  select p.account_status into v_status from public.profiles p where p.id = v_user;
  if not found or v_status is distinct from 'pending_deletion' then
    raise exception 'É necessário pedir a eliminação antes de a confirmar' using errcode = '22023';
  end if;

  select coalesce(array_agg(p.id), array[]::uuid[]) into v_professional_ids from public.profissionais p where p.user_id = v_user;
  select coalesce(array_agg(c.id), array[]::uuid[]) into v_company_ids from public.companies c where c.user_id = v_user;
  select coalesce(array_agg(s.id), array[]::uuid[]) into v_service_ids from public.servicos s
    where s.profissional_id = any(v_professional_ids) or s.company_id = any(v_company_ids);
  select coalesce(array_agg(p.id), array[]::uuid[]) into v_product_ids from public.produtos p where p.company_id = any(v_company_ids);
  select coalesce(array_agg(v.id), array[]::uuid[]) into v_vacancy_ids from public.vagas v where v.company_id = any(v_company_ids);
  select coalesce(array_agg(c.id), array[]::uuid[]) into v_conversation_ids from public.conversas c
    where c.cliente_id = v_user or c.profissional_id = any(v_professional_ids) or c.empresa_id = any(v_company_ids);

  v_prefixes := array[v_user::text]
    || coalesce((select array_agg(x::text) from unnest(v_professional_ids) x), array[]::text[])
    || coalesce((select array_agg(x::text) from unnest(v_company_ids) x), array[]::text[])
    || coalesce((select array_agg(x::text) from unnest(v_service_ids) x), array[]::text[])
    || coalesce((select array_agg(x::text) from unnest(v_product_ids) x), array[]::text[])
    || coalesce((select array_agg(x::text) from unnest(v_vacancy_ids) x), array[]::text[])
    || coalesce((select array_agg(x::text) from unnest(v_conversation_ids) x), array[]::text[]);

  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', o.bucket_id, 'name', o.name) order by o.bucket_id, o.name), '[]'::jsonb)
    into v_objects
  from storage.objects o
  where o.owner_id::text = v_user::text or o.owner::text = v_user::text
     or split_part(o.name, '/', 1) = any(v_prefixes);
  return jsonb_build_object('objects', v_objects);
end;
$function$;

revoke all on function public.get_own_account_deletion_storage_manifest() from public, anon;
grant execute on function public.get_own_account_deletion_storage_manifest() to authenticated;

create or replace function public.delete_own_account_permanently(p_confirmation text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_professional_ids uuid[] := array[]::uuid[];
  v_company_ids uuid[] := array[]::uuid[];
  v_service_ids uuid[] := array[]::uuid[];
  v_product_ids uuid[] := array[]::uuid[];
  v_vacancy_ids uuid[] := array[]::uuid[];
  v_conversation_ids uuid[] := array[]::uuid[];
  v_manifest jsonb;
begin
  if v_user is null or exists (select 1 from public.admin_users a where a.user_id = v_user) then
    raise exception 'Conta inválida para eliminação própria' using errcode = '42501';
  end if;
  if p_confirmation is distinct from 'ELIMINAR' then
    raise exception 'Confirmação inválida. Escreva exactamente ELIMINAR.' using errcode = '22023';
  end if;

  select p.account_status into v_status from public.profiles p where p.id = v_user for update;
  if not found then raise exception 'Conta não encontrada' using errcode = 'P0002'; end if;
  if v_status is distinct from 'pending_deletion' then
    raise exception 'É necessário pedir a eliminação antes de a confirmar' using errcode = '22023';
  end if;

  v_manifest := public.get_own_account_deletion_storage_manifest();
  if jsonb_array_length(coalesce(v_manifest -> 'objects', '[]'::jsonb)) > 0 then
    raise exception 'Ainda existem ficheiros associados. A remoção pela Storage API é obrigatória.' using errcode = '55000';
  end if;

  select coalesce(array_agg(p.id), array[]::uuid[]) into v_professional_ids from public.profissionais p where p.user_id = v_user;
  select coalesce(array_agg(c.id), array[]::uuid[]) into v_company_ids from public.companies c where c.user_id = v_user;
  select coalesce(array_agg(s.id), array[]::uuid[]) into v_service_ids from public.servicos s
    where s.profissional_id = any(v_professional_ids) or s.company_id = any(v_company_ids);
  select coalesce(array_agg(p.id), array[]::uuid[]) into v_product_ids from public.produtos p where p.company_id = any(v_company_ids);
  select coalesce(array_agg(v.id), array[]::uuid[]) into v_vacancy_ids from public.vagas v where v.company_id = any(v_company_ids);
  select coalesce(array_agg(c.id), array[]::uuid[]) into v_conversation_ids from public.conversas c
    where c.cliente_id = v_user or c.profissional_id = any(v_professional_ids) or c.empresa_id = any(v_company_ids);

  perform set_config('negomapa.self_service_account', 'on', true);
  update public.profiles set account_status = 'deleted', deleted_at = coalesce(deleted_at, now()),
    deleted_by = v_user, updated_at = now() where id = v_user;

  insert into public.account_status_audit(actor_id, target_id, action, previous_status, new_status, metadata)
  values (v_user, v_user, 'confirm_deletion', 'pending_deletion', 'deleted',
    jsonb_build_object('permanent', true, 'professional_profiles', cardinality(v_professional_ids),
      'companies', cardinality(v_company_ids), 'services', cardinality(v_service_ids),
      'products', cardinality(v_product_ids), 'vacancies', cardinality(v_vacancy_ids)));

  delete from public.denuncias d where d.user_id = v_user or d.company_id = any(v_company_ids)
    or d.profissional_id = any(v_professional_ids) or d.servico_id = any(v_service_ids) or d.vaga_id = any(v_vacancy_ids);
  delete from public.candidaturas c where c.user_id = v_user or c.vaga_id = any(v_vacancy_ids);
  delete from public.pedidos_servico p where p.cliente_id = v_user
    or p.profissional_id = any(v_professional_ids) or p.servico_id = any(v_service_ids);

  delete from public.mensagem_anexos a where a.remetente_id = v_user or a.conversa_id = any(v_conversation_ids);
  delete from public.mensagens m where m.remetente_id = v_user or m.conversa_id = any(v_conversation_ids);
  delete from public.conversas c where c.id = any(v_conversation_ids);

  with recursive mensagens_admin(id) as (
    select m.id from public.admin_messages m where m.sender_id = v_user or m.recipient_id = v_user
    union
    select child.id from public.admin_messages child join mensagens_admin parent on child.parent_id = parent.id
  )
  delete from public.admin_messages m where m.id in (select id from mensagens_admin);

  delete from public.notificacoes n where n.user_id = v_user;
  delete from public.preferencias_notificacao p where p.user_id = v_user;
  delete from public.preferencias_cliente p where p.user_id = v_user;
  delete from public.conta_detalhes d where d.user_id = v_user;

  delete from public.produto_imagens i where i.produto_id = any(v_product_ids);
  delete from public.servicos s where s.id = any(v_service_ids);
  delete from public.produtos p where p.id = any(v_product_ids);
  delete from public.vagas v where v.id = any(v_vacancy_ids);
  delete from public.companies c where c.id = any(v_company_ids);
  delete from public.profissionais p where p.id = any(v_professional_ids);

  delete from auth.users u where u.id = v_user;
  if not found then raise exception 'Não foi possível remover o utilizador de autenticação' using errcode = 'P0002'; end if;
  return jsonb_build_object('deleted', true, 'status', 'deleted');
end;
$function$;

revoke all on function public.delete_own_account_permanently(text) from public, anon;
grant execute on function public.delete_own_account_permanently(text) to authenticated;

create or replace function public.confirm_delete_own_account(p_confirmation text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
begin
  return public.delete_own_account_permanently(p_confirmation);
end;
$function$;
revoke all on function public.confirm_delete_own_account(text) from public, anon;
grant execute on function public.confirm_delete_own_account(text) to authenticated;

commit;
