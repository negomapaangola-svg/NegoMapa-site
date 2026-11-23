-- Restringe as colunas de public.profissionais legíveis por anon e authenticated.
--
-- Não altera políticas RLS nem dados. service_role mantém acesso total
-- (ignora RLS e não depende destes grants).
--
-- ATENÇÃO: NÃO APLICAR antes de resolver o acesso a telefone pelo próprio dono.
-- getUserProfile() (src/lib/actions/servicos.ts) lê telefone com a sessão
-- authenticated e é usada por /editar-perfil e /cadastrar-servico.
--
-- Efeito:
--   anon          : id, nome, slug, bio, provincia, municipio, estado, avatar_url,
--                   portfolio, anos_experiencia, disponibilidade_dias,
--                   disponibilidade_horarios, created_at, whatsapp
--   authenticated : as colunas de anon + user_id + updated_at
--   Ninguém (exceto service_role): bi_numero. Não legível por anon nem authenticated.
--   authenticated não lê telefone (ver atenção acima).

-- O grant de tabela inteira tem de sair primeiro; senão o grant de colunas não restringe nada.
REVOKE SELECT ON public.profissionais FROM anon, authenticated;

GRANT SELECT (
  id, nome, slug, bio, provincia, municipio, estado, avatar_url, portfolio,
  anos_experiencia, disponibilidade_dias, disponibilidade_horarios, created_at,
  whatsapp
) ON public.profissionais TO anon;

GRANT SELECT (
  id, nome, slug, bio, provincia, municipio, estado, avatar_url, portfolio,
  anos_experiencia, disponibilidade_dias, disponibilidade_horarios, created_at,
  whatsapp, user_id, updated_at
) ON public.profissionais TO authenticated;

-- Reversão (restaura o SELECT de tabela inteira, como antes):
--   REVOKE SELECT ON public.profissionais FROM anon, authenticated;
--   GRANT SELECT ON public.profissionais TO anon, authenticated;
