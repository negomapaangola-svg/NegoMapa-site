-- Fase 1: limites e buckets dedicados de imagens.
begin;
update storage.buckets set file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp']::text[] where id in('profissionais-avatars','empresas-logos','profissionais-portfolio');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('clientes-avatars','clientes-avatars',false,10485760,array['image/jpeg','image/png','image/webp']::text[]) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('empresas-portfolio','empresas-portfolio',false,10485760,array['image/jpeg','image/png','image/webp']::text[]) on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy clientes_avatar_select_owner on storage.objects for select to authenticated using(bucket_id='clientes-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy clientes_avatar_insert_owner on storage.objects for insert to authenticated with check(bucket_id='clientes-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy clientes_avatar_update_owner on storage.objects for update to authenticated using(bucket_id='clientes-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='clientes-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy clientes_avatar_delete_owner on storage.objects for delete to authenticated using(bucket_id='clientes-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy empresas_portfolio_select_owner on storage.objects for select to authenticated using(bucket_id='empresas-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy empresas_portfolio_insert_owner on storage.objects for insert to authenticated with check(bucket_id='empresas-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy empresas_portfolio_update_owner on storage.objects for update to authenticated using(bucket_id='empresas-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='empresas-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy empresas_portfolio_delete_owner on storage.objects for delete to authenticated using(bucket_id='empresas-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy empresas_portfolio_public_approved on storage.objects for select to anon,authenticated using(bucket_id='empresas-portfolio' and public.imagem_publica_aprovada(bucket_id,name));
create or replace function public.imagem_publica_aprovada(p_bucket text,p_name text)
returns boolean language sql stable security definer set search_path=''
as $ select case p_bucket
when 'profissionais-avatars' then exists(select 1 from public.profissionais p where p.estado='aprovado' and strpos(coalesce(p.avatar_url,''),p_name)>0)
when 'profissionais-portfolio' then exists(select 1 from public.profissionais p where p.estado='aprovado' and strpos(coalesce(p.portfolio::text,''),p_name)>0)
when 'empresas-logos' then exists(select 1 from public.companies c where c.is_approved=true and strpos(coalesce(c.logo_url,''),p_name)>0)
when 'empresas-portfolio' then exists(select 1 from public.companies c where c.is_approved=true and strpos(coalesce(c.portfolio::text,''),p_name)>0)
else false end $;
commit;
