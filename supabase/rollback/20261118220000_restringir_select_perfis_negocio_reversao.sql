begin;

-- Rollback exacto dos privilégios SELECT desta migração.
revoke select (
  id, name, slug, sector, province, city, bairro, rua,
  referencia_localizacao, description, email, phone, horario_atendimento,
  estado_legalizacao, documento_legalizacao_url, is_approved, created_at,
  user_id, estado
) on table public.companies from authenticated;
grant select on table public.companies to authenticated;

revoke select (
  id, nome, slug, bio, provincia, municipio, estado, avatar_url, portfolio,
  anos_experiencia, disponibilidade_dias, disponibilidade_horarios, created_at,
  whatsapp, user_id, updated_at, bairro, categoria_id, especialidades,
  experiencia_faixa, faixa_preco_desde, disponibilidade
) on table public.profissionais from authenticated;
grant select on table public.profissionais to authenticated;

commit;
