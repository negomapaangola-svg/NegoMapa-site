begin;

-- Repor as vistas públicas originais e remover as vistas segregadas da Fase 6.
create or replace view public.empresas_publicas
with (security_invoker = true) as
select
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, horario_atendimento,
  is_verified, is_approved, whatsapp, logo_url, portfolio
from negomapa_private.v_empresas_publicas;

create or replace view public.profissionais_publicos
with (security_invoker = true) as
select
  id, nome, slug, categoria_id, categoria, provincia, municipio,
  anos_experiencia, bio, whatsapp, avatar_url, portfolio,
  disponibilidade_dias, disponibilidade_horarios, especialidades,
  experiencia_faixa, faixa_preco_desde
from negomapa_private.v_profissionais_publicos;

revoke select on negomapa_private.v_empresas_publicas_fase6 from anon, authenticated;
revoke select on negomapa_private.v_profissionais_publicos_fase6 from anon, authenticated;
drop view if exists negomapa_private.v_empresas_publicas_fase6;
drop view if exists negomapa_private.v_profissionais_publicos_fase6;

create or replace function public.empresa_aprovada(p_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (select 1 from public.companies e where e.id = p_id and e.is_approved = true)
$function$;

create or replace function public.perfil_profissional_aprovado(p_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (select 1 from public.profissionais p where p.id = p_id and p.estado = 'aprovado')
$function$;

drop policy if exists conversas_insert_cliente on public.conversas;
create policy conversas_insert_cliente on public.conversas
  as permissive for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and ((empresa_id is null) or not (empresa_id in (
      select e.id from public.companies e where e.user_id = (select auth.uid())
    )))
    and ((profissional_id is null) or not (profissional_id in (
      select p.id from public.profissionais p where p.user_id = (select auth.uid())
    )))
    and (
      (profissional_id is not null and public.perfil_profissional_aprovado(profissional_id))
      or (empresa_id is not null and public.empresa_aprovada(empresa_id))
    )
  );

commit;
