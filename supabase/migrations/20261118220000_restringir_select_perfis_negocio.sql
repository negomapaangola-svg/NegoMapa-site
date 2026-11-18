begin;

-- Remove os GRANT SELECT ao nível da tabela introduzidos pela migração
-- 20261118190000. Mantém apenas as colunas públicas/operacionais necessárias.
-- Campos privados de dono são lidos pelos RPCs get_my_company_profile e
-- get_my_professional_account, que filtram estritamente por auth.uid().
revoke select on table public.companies from authenticated;
grant select (
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, email, phone, horario_atendimento,
  estado_legalizacao, documento_legalizacao_url, is_approved, created_at,
  user_id, estado
) on table public.companies to authenticated;

revoke select on table public.profissionais from authenticated;
grant select (
  id, nome, slug, bio, provincia, municipio, estado, avatar_url, portfolio,
  anos_experiencia, disponibilidade_dias, disponibilidade_horarios, created_at,
  whatsapp, user_id, updated_at, bairro, categoria_id, especialidades,
  experiencia_faixa, faixa_preco_desde, disponibilidade
) on table public.profissionais to authenticated;

commit;
