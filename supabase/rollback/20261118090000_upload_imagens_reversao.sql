-- Remover políticas e bucket de avatar de cliente/portfólio de empresa sem apagar conteúdo do utilizador.
begin;
drop policy if exists empresas_portfolio_public_approved on storage.objects;
drop policy if exists empresas_portfolio_delete_owner on storage.objects;
drop policy if exists empresas_portfolio_update_owner on storage.objects;
drop policy if exists empresas_portfolio_insert_owner on storage.objects;
drop policy if exists empresas_portfolio_select_owner on storage.objects;
drop policy if exists clientes_avatar_delete_owner on storage.objects;
drop policy if exists clientes_avatar_update_owner on storage.objects;
drop policy if exists clientes_avatar_insert_owner on storage.objects;
drop policy if exists clientes_avatar_select_owner on storage.objects;
do $$ begin
 if exists(select 1 from storage.objects where bucket_id in('clientes-avatars','empresas-portfolio')) then
   raise exception 'Buckets contêm ficheiros; exporte ou migre os objectos antes de remover os buckets.';
 end if;
end $$;
delete from storage.buckets where id in('clientes-avatars','empresas-portfolio');
update storage.buckets set file_size_limit=1048576 where id='profissionais-avatars';
update storage.buckets set file_size_limit=2097152 where id='empresas-logos';
update storage.buckets set file_size_limit=5242880 where id='profissionais-portfolio';
commit;
