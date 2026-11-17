-- Reversão da migração segura de imagens. Não apaga ficheiros de utilizadores.
begin;

drop policy if exists imagens_dono_select on storage.objects;
drop policy if exists imagens_dono_insert on storage.objects;
drop policy if exists imagens_dono_update on storage.objects;
drop policy if exists imagens_dono_delete on storage.objects;
drop policy if exists imagens_publicas_aprovadas on storage.objects;
drop function if exists public.pode_apagar_imagem(text,text);
drop function if exists private.pode_apagar_imagem(text,text);
drop function if exists public.pode_servir_imagem(text,text);
drop function if exists private.imagem_publica_aprovada(text,text);

do $$
begin
  if exists(select 1 from storage.objects where bucket_id in ('clientes-avatars','empresas-portfolio')) then
    raise exception 'Os buckets novos contêm ficheiros. Exporte/migre os objectos antes de reverter.';
  end if;
end $$;

delete from storage.buckets where id in ('clientes-avatars','empresas-portfolio');

-- Restaurar os limites anteriores conhecidos.
update storage.buckets set file_size_limit=1048576, public=false where id='profissionais-avatars';
update storage.buckets set file_size_limit=2097152, public=false where id='empresas-logos';
update storage.buckets set file_size_limit=5242880, public=false where id='profissionais-portfolio';

-- Restaurar a função anterior para compatibilidade com a política histórica.
create or replace function public.imagem_publica_aprovada(p_bucket text,p_name text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select case p_bucket
    when 'profissionais-avatars' then exists(
      select 1 from public.profissionais p
      where p.estado='aprovado' and strpos(coalesce(p.avatar_url,''),p_name)>0
    )
    when 'profissionais-portfolio' then exists(
      select 1 from public.profissionais p
      where p.estado='aprovado' and strpos(coalesce(p.portfolio::text,''),p_name)>0
    )
    when 'empresas-logos' then exists(
      select 1 from public.companies c
      where c.is_approved=true and strpos(coalesce(c.logo_url,''),p_name)>0
    )
    else false
  end;
$$;
grant execute on function public.imagem_publica_aprovada(text,text) to anon, authenticated;

create policy empresas_logos_select_admin on storage.objects for select to authenticated using (bucket_id='empresas-logos' and is_admin());

create policy imagens_publicas_aprovadas on storage.objects
for select to anon, authenticated
using (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and imagem_publica_aprovada(bucket_id,name)
);

-- Repor políticas de proprietário originais para os três buckets existentes.
create policy imagens_dono_select on storage.objects
for select to authenticated using (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy imagens_dono_insert on storage.objects
for insert to authenticated with check (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy imagens_dono_update on storage.objects
for update to authenticated using (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and (storage.foldername(name))[1]=(select auth.uid())::text
) with check (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy imagens_dono_delete on storage.objects
for delete to authenticated using (
  bucket_id in ('empresas-logos','profissionais-avatars','profissionais-portfolio')
  and (storage.foldername(name))[1]=(select auth.uid())::text
);

commit;
