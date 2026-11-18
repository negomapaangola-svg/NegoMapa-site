begin;

-- Restaura as vistas públicas anteriores.
create or replace view negomapa_private.v_empresas_publicas as
select
  c.id, c.name, c.slug, c.sector, c.province, c.city, c.bairro, c.rua,
  c.referencia_localizacao, c.description, c.horario_atendimento,
  c.is_verified, c.is_approved, c.whatsapp, c.logo_url, c.portfolio
from public.companies c;

create or replace view negomapa_private.v_profissionais_publicos as
select
  p.id, p.nome, p.slug, p.categoria_id, c.nome as categoria,
  p.provincia, p.municipio, p.anos_experiencia, p.bio, p.whatsapp,
  p.avatar_url, p.portfolio, p.disponibilidade_dias,
  p.disponibilidade_horarios, p.especialidades, p.experiencia_faixa,
  p.faixa_preco_desde
from public.profissionais p
left join public.categorias c on c.id = p.categoria_id;

-- Restaura os helpers anteriores.
create or replace function public.empresa_aprovada(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.companies e
    where e.id = p_id and e.is_approved = true
  )
$function$;

create or replace function public.perfil_profissional_aprovado(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profissionais p
    where p.id = p_id and p.estado = 'aprovado'
  )
$function$;

-- Restaura a policy anterior, com a mesma lógica de autorização original.
drop policy if exists conversas_insert_cliente on public.conversas;
create policy conversas_insert_cliente
  on public.conversas
  as permissive
  for insert
  to authenticated
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
