begin;

-- Leitura privada do próprio perfil empresarial: a função nunca devolve
-- registos de terceiros e não depende de SELECT amplo na tabela companies.
create or replace function public.get_my_company_profile()
returns table (
  id uuid,
  name text,
  sector text,
  province text,
  city text,
  bairro text,
  rua text,
  referencia_localizacao text,
  website text,
  description text,
  whatsapp text,
  phone text,
  logo_url text,
  is_approved boolean,
  estado text,
  horario_atendimento text,
  portfolio jsonb
)
language sql
stable
security definer
set search_path = ''
as $function$
  select c.id, c.name, c.sector, c.province, c.city, c.bairro, c.rua,
         c.referencia_localizacao, c.website, c.description, c.whatsapp,
         c.phone, c.logo_url, c.is_approved, c.estado, c.horario_atendimento,
         c.portfolio
    from public.companies c
   where c.user_id = (select auth.uid())
$function$;

-- Leitura privada do próprio perfil profissional, incluindo campos que
-- não devem ser concedidos por SELECT directo à tabela.
create or replace function public.get_my_professional_account()
returns table (
  id uuid,
  nome text,
  telefone text,
  whatsapp text,
  bio text,
  provincia text,
  municipio text,
  bairro text,
  estado text,
  avatar_url text,
  categoria_id uuid,
  especialidades text[],
  disponibilidade text,
  disponibilidade_dias text[],
  disponibilidade_horarios jsonb,
  portfolio jsonb
)
language sql
stable
security definer
set search_path = ''
as $function$
  select p.id, p.nome, p.telefone, p.whatsapp, p.bio, p.provincia,
         p.municipio, p.bairro, p.estado, p.avatar_url, p.categoria_id,
         p.especialidades, p.disponibilidade, p.disponibilidade_dias,
         p.disponibilidade_horarios, p.portfolio
    from public.profissionais p
   where p.user_id = (select auth.uid())
$function$;

revoke all on function public.get_my_company_profile() from public, anon;
grant execute on function public.get_my_company_profile() to authenticated;
revoke all on function public.get_my_professional_account() from public, anon;
grant execute on function public.get_my_professional_account() to authenticated;

commit;
