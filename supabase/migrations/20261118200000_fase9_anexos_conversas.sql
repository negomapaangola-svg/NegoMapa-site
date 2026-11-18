-- Fase 9: anexos privados de conversas. Não altera tabelas, mensagens ou políticas existentes.
begin;

create table if not exists public.mensagem_anexos (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.mensagens(id) on delete cascade,
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  nome_ficheiro text not null check (length(nome_ficheiro) between 1 and 120),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp','text/plain')),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 10485760),
  storage_path text not null unique,
  criada_em timestamptz not null default now()
);
create index if not exists mensagem_anexos_conversa_idx on public.mensagem_anexos(conversa_id);
create index if not exists mensagem_anexos_mensagem_idx on public.mensagem_anexos(mensagem_id);

alter table public.mensagem_anexos enable row level security;
revoke all on public.mensagem_anexos from public, anon, authenticated;
grant select, insert on public.mensagem_anexos to authenticated;

create policy mensagem_anexos_select_participante on public.mensagem_anexos
  for select to authenticated using (negomapa_private.is_account_active((select auth.uid())) and public.conversa_participante(conversa_id));
create policy mensagem_anexos_insert_remetente on public.mensagem_anexos
  for insert to authenticated with check (
    remetente_id = (select auth.uid())
    and negomapa_private.is_account_active((select auth.uid()))
    and public.conversa_participante(conversa_id)
    and exists (
      select 1 from public.mensagens m
      where m.id = mensagem_anexos.mensagem_id
        and m.conversa_id = mensagem_anexos.conversa_id
        and m.remetente_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('conversas-anexos', 'conversas-anexos', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','text/plain'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'conversas-anexos' and public = false
      and file_size_limit = 10485760
      and allowed_mime_types @> array['application/pdf','image/jpeg','image/png','image/webp','text/plain']
  ) then
    raise exception 'Bucket conversas-anexos existente não corresponde à configuração privada esperada';
  end if;
end;
$$;

drop policy if exists conversas_anexos_select_participante on storage.objects;
create policy conversas_anexos_select_participante on storage.objects
  for select to authenticated using (
    bucket_id = 'conversas-anexos'
    and exists (select 1 from public.conversas c
      where c.id::text = (storage.foldername(name))[1]
        and public.conversa_participante(c.id)
        and exists (
          select 1 from public.mensagem_anexos ma
          where ma.conversa_id = c.id and ma.storage_path = storage.objects.name
        ))
  );
drop policy if exists conversas_anexos_insert_participante on storage.objects;
create policy conversas_anexos_insert_participante on storage.objects
  for insert to authenticated with check (
    bucket_id = 'conversas-anexos'
    and exists (select 1 from public.conversas c
      where c.id::text = (storage.foldername(name))[1] and negomapa_private.is_account_active((select auth.uid()))
        and public.conversa_participante(c.id))
  );
drop policy if exists conversas_anexos_delete_participante on storage.objects;
create policy conversas_anexos_delete_participante on storage.objects
  for delete to authenticated using (
    bucket_id = 'conversas-anexos'
    and exists (select 1 from public.conversas c
      where c.id::text = (storage.foldername(name))[1] and negomapa_private.is_account_active((select auth.uid()))
        and public.conversa_participante(c.id))
  );

create or replace function public.perfis_remetentes_conversa(p_conversa_id uuid, p_user_ids uuid[])
returns table(id uuid, nome text, account_type text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.nome, p.account_type
  from public.profiles p
  where p.id = any(coalesce(p_user_ids, array[]::uuid[]))
    and cardinality(coalesce(p_user_ids, array[]::uuid[])) between 1 and 100
    and exists (
      select 1 from public.conversas c
      where c.id = p_conversa_id
        and negomapa_private.is_account_active(auth.uid())
        and public.conversa_participante(c.id)
        and (
          p.id = c.cliente_id
          or exists (select 1 from public.profissionais pr where pr.id = c.profissional_id and pr.user_id = p.id)
          or exists (select 1 from public.companies co where co.id = c.empresa_id and co.user_id = p.id)
        )
    );
$$;
revoke all on function public.perfis_remetentes_conversa(uuid, uuid[]) from public, anon;
grant execute on function public.perfis_remetentes_conversa(uuid, uuid[]) to authenticated;

create or replace function public.criar_mensagem_com_anexo(
  p_conversa_id uuid, p_nome_ficheiro text, p_mime_type text,
  p_tamanho_bytes bigint, p_storage_path text
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare v_mensagem_id uuid;
begin
  if auth.uid() is null or not negomapa_private.is_account_active(auth.uid())
    or not public.conversa_participante(p_conversa_id)
    or p_storage_path not like p_conversa_id::text || '/%'
    or p_mime_type not in ('application/pdf','image/jpeg','image/png','image/webp','text/plain')
    or p_tamanho_bytes not between 1 and 10485760
    or length(p_nome_ficheiro) not between 1 and 120 then
    raise exception 'Conversa ou ficheiro inválido' using errcode = '42501';
  end if;
  insert into public.mensagens(conversa_id, remetente_id, conteudo)
  values (p_conversa_id, auth.uid(), 'Ficheiro anexado')
  returning id into v_mensagem_id;
  insert into public.mensagem_anexos(
    mensagem_id, conversa_id, remetente_id, nome_ficheiro, mime_type, tamanho_bytes, storage_path
  ) values (
    v_mensagem_id, p_conversa_id, auth.uid(), p_nome_ficheiro, p_mime_type, p_tamanho_bytes, p_storage_path
  );
  return v_mensagem_id;
end;
$$;
revoke all on function public.criar_mensagem_com_anexo(uuid, text, text, bigint, text) from public, anon;
grant execute on function public.criar_mensagem_com_anexo(uuid, text, text, bigint, text) to authenticated;

commit;
