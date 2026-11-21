-- Reverte apenas o esquema e as políticas introduzidos pela Fase 9.
-- Não elimina objectos; o bucket só é removido se estiver vazio.
begin;
drop function if exists public.criar_mensagem_com_anexo(uuid, text, text, bigint, text);
drop function if exists public.perfis_remetentes_conversa(uuid, uuid[]);
drop policy if exists conversas_anexos_delete_participante on storage.objects;
drop policy if exists conversas_anexos_insert_participante on storage.objects;
drop policy if exists conversas_anexos_select_participante on storage.objects;
drop table if exists public.mensagem_anexos;
delete from storage.buckets b
where b.id = 'conversas-anexos'
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);
commit;
