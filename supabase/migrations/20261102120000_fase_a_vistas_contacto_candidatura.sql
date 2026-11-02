-- =============================================================================
-- FASE A (aditiva e reversível) — NegóMapa
-- NÃO APLICADA. Aguarda autorização explícita antes de qualquer execução
-- em produção. Ensaiar primeiro num branch Supabase.
-- Revisão estática feita (Tarefa 5). Nenhum SQL executado.
--
-- Âmbito: cria vistas e funções novas. Não revoga SELECT nem EXECUTE de
-- objetos já existentes (is_admin() incluído: fica para a Fase separada).
-- Não altera colunas, políticas, dados nem storage.
--
-- Requisitos: PostgreSQL 15 ou superior (security_invoker em vistas).
-- Reversão: supabase/rollback/20261102120000_fase_a_reversao.sql
-- Testes:   supabase/tests/fase_a_testes_T1_T10.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Vista pública de empresas (apenas colunas seguras)
--    Excluídas: nif, documento_legalizacao_url, documento_legalizacao_path,
--    logo_url, whatsapp, website, documents_url, user_id, created_at.
--    Pendentes de decisão (excluídas por agora): phone, email, estado_legalizacao.
--
--    Privilégios por coluna: com security_invoker, a vista só precisa de SELECT
--    nas colunas que seleciona. Todas as colunas abaixo já estão concedidas a
--    anon e authenticated em companies (verificado em produção, só leitura).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.empresas_publicas
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.sector,
  c.province,
  c.city,
  c.bairro,
  c.rua,
  c.referencia_localizacao,
  c.description,
  c.horario_atendimento,
  c.is_verified,
  c.is_approved
FROM public.companies c;

COMMENT ON VIEW public.empresas_publicas IS
  'Leitura pública de empresas. security_invoker: RLS e privilégios de coluna do chamador. Não expõe NIF, documentos nem WhatsApp.';

-- Privilégios explícitos na vista nova (não herdar defaults do schema).
REVOKE ALL ON public.empresas_publicas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.empresas_publicas TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Vista pública de vagas (sem WhatsApp, motivo de rejeição nem auditoria)
--    Excluídas: whatsapp, motivo_rejeicao, avaliado_por, avaliado_em, updated_at.
--    anon e authenticated têm SELECT de tabela em vagas (verificado), por isso
--    a vista funciona sem alterar grants existentes.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vagas_publicas
WITH (security_invoker = true) AS
SELECT
  v.id,
  v.company_id,
  v.titulo,
  v.slug,
  v.descricao,
  v.requisitos,
  v.categoria,
  v.provincia,
  v.municipio,
  v.tipo_contrato,
  v.salario,
  v.estado,
  v.created_at
FROM public.vagas v;

COMMENT ON VIEW public.vagas_publicas IS
  'Leitura pública de vagas. security_invoker: RLS do chamador. Não expõe WhatsApp de candidatura nem dados de moderação.';

REVOKE ALL ON public.vagas_publicas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vagas_publicas TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Contacto de candidatura (função nova)
--    Devolve o WhatsApp só se: utilizador autenticado, perfil profissional
--    aprovado, vaga aprovada e empresa aprovada. Caso contrário, NULL.
--    Tipos verificados: profissionais.user_id (uuid), profissionais.estado (text),
--    vagas.whatsapp (text), vagas.estado (text), companies.is_approved (boolean).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_contacto_candidatura(p_vaga_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_whatsapp text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.profissionais p
     WHERE p.user_id = auth.uid()
       AND p.estado = 'aprovado'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT v.whatsapp
    INTO v_whatsapp
    FROM public.vagas v
    JOIN public.companies c ON c.id = v.company_id
   WHERE v.id = p_vaga_id
     AND v.estado = 'aprovado'
     AND c.is_approved = true;

  RETURN v_whatsapp;
END;
$$;

COMMENT ON FUNCTION public.obter_contacto_candidatura(uuid) IS
  'WhatsApp de candidatura apenas para profissional autenticado e aprovado, em vaga aprovada. Caso contrário, NULL.';

REVOKE EXECUTE ON FUNCTION public.obter_contacto_candidatura(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_contacto_candidatura(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Dados completos da própria empresa (função nova, dono)
--    SECURITY DEFINER: ignora privilégios de coluna, por isso o filtro
--    user_id = auth.uid() é a única barreira e é obrigatório.
--    Devolve o tipo de linha de companies (SETOF public.companies).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_minha_empresa()
RETURNS SETOF public.companies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.*
    FROM public.companies c
   WHERE c.user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.obter_minha_empresa() IS
  'Devolve a própria empresa do utilizador autenticado, incluindo campos privados. Filtro por auth.uid() obrigatório.';

REVOKE EXECUTE ON FUNCTION public.obter_minha_empresa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_minha_empresa() TO authenticated;
