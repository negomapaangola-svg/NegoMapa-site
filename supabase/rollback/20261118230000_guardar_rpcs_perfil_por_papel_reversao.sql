begin;

-- Rollback: repõe as definições anteriores, sem restrição account_type/admin.
create or replace function public.get_my_company_profile()
returns table (
  id uuid, name text, sector text, province text, city text, bairro text,
  rua text, referencia_localizacao text, website text, description text,
  whatsapp text, phone text, logo_url text, is_approved boolean, estado text,
  horario_atendimento text, portfolio jsonb
)
language sql stable security definer set search_path = ''
as $function$
  select c.id, c.name, c.sector, c.province, c.city, c.bairro, c.rua,
         c.referencia_localizacao, c.website, c.description, c.whatsapp,
         c.phone, c.logo_url, c.is_approved, c.estado, c.horario_atendimento,
         c.portfolio
    from public.companies c
   where c.user_id = (select auth.uid())
$function$;

create or replace function public.get_my_professional_account()
returns table (
  id uuid, nome text, telefone text, whatsapp text, bio text, provincia text,
  municipio text, bairro text, estado text, avatar_url text,
  categoria_id uuid, especialidades text[], disponibilidade text,
  disponibilidade_dias text[], disponibilidade_horarios jsonb, portfolio jsonb
)
language sql stable security definer set search_path = ''
as $function$
  select p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia,
         p.municipio, p.bairro, p.estado, p.avatar_url, p.categoria_id,
         p.especialidades, p.disponibilidade, p.disponibilidade_dias,
         p.disponibilidade_horarios, p.portfolio
    from public.profissionais p
   where p.user_id = (select auth.uid())
$function$;

create or replace function public.get_my_profissional_profile()
returns table (
  id uuid, nome text, telefone text, whatsapp text, bio text, provincia text,
  municipio text, estado text, motivo_rejeicao text, slug text,
  avatar_url text, anos_experiencia smallint,
  disponibilidade_dias text[], disponibilidade_horarios jsonb, portfolio jsonb
)
language sql stable security definer set search_path = ''
as $function$
  select p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia, p.municipio,
         p.estado, p.motivo_rejeicao, p.slug, p.avatar_url, p.anos_experiencia,
         p.disponibilidade_dias, p.disponibilidade_horarios, p.portfolio
    from public.profissionais p
   where p.user_id = (select auth.uid())
$function$;

create or replace function public.obter_bi_proprio()
returns text
language sql stable security definer set search_path = ''
as $function$
  select p.bi_numero from public.profissionais p where p.user_id = (select auth.uid())
$function$;

commit;
