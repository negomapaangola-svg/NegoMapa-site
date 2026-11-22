begin;

-- Views públicas segregadas: só mostram negócios aprovados cujo proprietário
-- é uma conta activa do papel correspondente, nunca cliente/admin legado.
create or replace view negomapa_private.v_empresas_publicas_fase6
with (security_barrier = true, security_invoker = false) as
select
  c.id, c.name, c.slug, c.sector, c.province, c.city, c.bairro, c.rua,
  c.referencia_localizacao, c.description, c.horario_atendimento,
  c.is_verified, c.is_approved, c.whatsapp, c.logo_url, c.portfolio
from public.companies c
join public.profiles owner_profile on owner_profile.id = c.user_id
where c.is_approved is true
  and coalesce(c.estado, 'aprovado') = 'aprovado'
  and owner_profile.account_type = 'empresa'
  and owner_profile.is_active is true
  and not exists (select 1 from public.admin_users a where a.user_id = c.user_id);

create or replace view negomapa_private.v_profissionais_publicos_fase6
with (security_barrier = true, security_invoker = false) as
select
  p.id, p.nome, p.slug, p.categoria_id, c.nome as categoria,
  p.provincia, p.municipio, p.anos_experiencia, p.bio, p.whatsapp,
  p.avatar_url, p.portfolio, p.disponibilidade_dias,
  p.disponibilidade_horarios, p.especialidades, p.experiencia_faixa,
  p.faixa_preco_desde
from public.profissionais p
left join public.categorias c on c.id = p.categoria_id
join public.profiles owner_profile on owner_profile.id = p.user_id
where p.estado = 'aprovado'
  and owner_profile.account_type = 'profissional'
  and owner_profile.is_active is true
  and not exists (select 1 from public.admin_users a where a.user_id = p.user_id);

grant select on negomapa_private.v_empresas_publicas_fase6 to anon, authenticated;
grant select on negomapa_private.v_profissionais_publicos_fase6 to anon, authenticated;

create or replace view public.empresas_publicas
with (security_invoker = true) as
select
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, horario_atendimento,
  is_verified, is_approved, whatsapp, logo_url, portfolio
from negomapa_private.v_empresas_publicas_fase6;

create or replace view public.profissionais_publicos
with (security_invoker = true) as
select
  id, nome, slug, categoria_id, categoria, provincia, municipio,
  anos_experiencia, bio, whatsapp, avatar_url, portfolio,
  disponibilidade_dias, disponibilidade_horarios, especialidades,
  experiencia_faixa, faixa_preco_desde
from negomapa_private.v_profissionais_publicos_fase6;

create or replace function public.empresa_aprovada(p_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.companies c
    join public.profiles owner_profile on owner_profile.id = c.user_id
    where c.id = p_id and c.is_approved is true
      and coalesce(c.estado, 'aprovado') = 'aprovado'
      and owner_profile.account_type = 'empresa'
      and owner_profile.is_active is true
      and not exists (select 1 from public.admin_users a where a.user_id = c.user_id)
  )
$function$;

create or replace function public.perfil_profissional_aprovado(p_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.profissionais p
    join public.profiles owner_profile on owner_profile.id = p.user_id
    where p.id = p_id and p.estado = 'aprovado'
      and owner_profile.account_type = 'profissional'
      and owner_profile.is_active is true
      and not exists (select 1 from public.admin_users a where a.user_id = p.user_id)
  )
$function$;

drop policy if exists conversas_insert_cliente on public.conversas;
create policy conversas_insert_cliente on public.conversas
  as permissive for insert to authenticated
  with check (
    cliente_id = (select auth.uid())
    and (empresa_id is null or not (empresa_id in (
      select e.id from public.companies e where e.user_id = (select auth.uid())
    )))
    and (profissional_id is null or not (profissional_id in (
      select p.id from public.profissionais p where p.user_id = (select auth.uid())
    )))
    and (
      (profissional_id is not null and public.perfil_profissional_aprovado(profissional_id))
      or (empresa_id is not null and public.empresa_aprovada(empresa_id))
    )
  );

commit;
