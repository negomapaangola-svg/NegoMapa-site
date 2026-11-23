-- Migração: Modelo de produtos (Fase 2)
-- Projeto: NegóMapa
-- Data: 2026-11-09
--
-- Âmbito: tabelas produtos e produto_imagens, triggers de proteção e de limites,
-- RLS, grants restritos e função de aprovação do administrador.
-- Não cria páginas, cartões nem storage (ver 20261109120100_produtos_storage.sql).
--
-- NÃO APLICAR EM PRODUÇÃO sem aprovação explícita. Testar primeiro num branch Supabase.

BEGIN;

-- ============================================================================
-- TABELA: produtos
-- Um produto pertence sempre a uma empresa (nunca a um profissional).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id),
  titulo text NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 3 AND 150),
  slug text NOT NULL UNIQUE,
  descricao text,
  -- Preço sempre em Kwanza (Kz). Nulo só quando o preço é "sob consulta".
  preco numeric(14,2) CHECK (preco IS NULL OR preco >= 0),
  preco_tipo text NOT NULL DEFAULT 'fixo' CHECK (preco_tipo IN ('fixo', 'sob_consulta')),
  estado_produto text NOT NULL CHECK (estado_produto IN ('novo', 'usado')),
  entrega text NOT NULL CHECK (entrega IN ('gratuita', 'paga', 'a_combinar')),
  provincia text NOT NULL,
  municipio text,
  -- WhatsApp específico do produto. Se vazio, a aplicação usa o número da empresa.
  whatsapp text,
  -- Controla a visibilidade pública. Só 'aprovado' aparece publicamente.
  estado_aprovacao text NOT NULL DEFAULT 'pendente'
    CHECK (estado_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao text,
  avaliado_em timestamptz,
  avaliado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  actualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT produtos_preco_obrigatorio CHECK (preco IS NOT NULL OR preco_tipo = 'sob_consulta'),
  CONSTRAINT produtos_motivo_rejeicao CHECK (
    estado_aprovacao <> 'rejeitado' OR char_length(btrim(coalesce(motivo_rejeicao, ''))) >= 10
  )
);

-- Índices pedidos: company_id, categoria_id, provincia, estado_aprovacao.
-- O índice de slug é criado pela restrição UNIQUE.
CREATE INDEX IF NOT EXISTS idx_produtos_company_id ON public.produtos(company_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_provincia ON public.produtos(provincia);
CREATE INDEX IF NOT EXISTS idx_produtos_estado_aprovacao ON public.produtos(estado_aprovacao);

-- ============================================================================
-- TABELA: produto_imagens
-- Entre 1 e 6 imagens por produto. A primeira (ordem mais baixa) é a principal.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.produto_imagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  -- Caminho do objeto no bucket privado 'produtos' (não é um URL público).
  url text NOT NULL CHECK (char_length(btrim(url)) > 0),
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produto_imagens_produto_ordem ON public.produto_imagens(produto_id, ordem);

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.produtos_actualizar_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.actualizado_em = now();
  RETURN NEW;
END;
$$;

-- Proteção do estado e do dono. Não-administradores não podem aprovar, rejeitar,
-- mudar a empresa, o criador ou os campos de avaliação. Um produto aprovado
-- exige pelo menos uma imagem.
CREATE OR REPLACE FUNCTION public.produtos_proteger_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_imagens integer;
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.criado_por := auth.uid();
      NEW.estado_aprovacao := 'pendente';
      NEW.motivo_rejeicao := NULL;
      NEW.avaliado_em := NULL;
      NEW.avaliado_por := NULL;
    ELSE
      IF NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao
         OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao
         OR NEW.avaliado_em IS DISTINCT FROM OLD.avaliado_em
         OR NEW.avaliado_por IS DISTINCT FROM OLD.avaliado_por THEN
        RAISE EXCEPTION 'Sem permissão para alterar a aprovação do produto.'
          USING ERRCODE = '42501';
      END IF;
      IF NEW.company_id IS DISTINCT FROM OLD.company_id
         OR NEW.criado_por IS DISTINCT FROM OLD.criado_por THEN
        RAISE EXCEPTION 'Sem permissão para alterar a empresa ou o criador do produto.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF NEW.estado_aprovacao = 'aprovado'
     AND (TG_OP = 'INSERT' OR NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao) THEN
    SELECT count(*) INTO total_imagens
    FROM public.produto_imagens
    WHERE produto_id = NEW.id;

    IF total_imagens < 1 THEN
      RAISE EXCEPTION 'O produto precisa de pelo menos 1 imagem para ser aprovado.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_produtos_actualizar_timestamp ON public.produtos;
CREATE TRIGGER trg_produtos_actualizar_timestamp
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.produtos_actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_produtos_proteger_estado ON public.produtos;
CREATE TRIGGER trg_produtos_proteger_estado
  BEFORE INSERT OR UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.produtos_proteger_estado();

-- Limite de 1 a 6 imagens: máximo 6 por produto.
CREATE OR REPLACE FUNCTION public.produto_imagens_validar_limite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_outras integer;
BEGIN
  SELECT count(*) INTO total_outras
  FROM public.produto_imagens
  WHERE produto_id = NEW.produto_id
    AND id <> NEW.id;

  IF total_outras >= 6 THEN
    RAISE EXCEPTION 'Cada produto pode ter no máximo 6 imagens.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_produto_imagens_validar_limite ON public.produto_imagens;
CREATE TRIGGER trg_produto_imagens_validar_limite
  BEFORE INSERT OR UPDATE OF produto_id ON public.produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION public.produto_imagens_validar_limite();

-- Mínimo de 1 imagem: não se apaga a última imagem de um produto aprovado.
CREATE OR REPLACE FUNCTION public.produto_imagens_validar_minimo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  produto_aprovado boolean;
  total_restantes integer;
BEGIN
  SELECT (estado_aprovacao = 'aprovado') INTO produto_aprovado
  FROM public.produtos
  WHERE id = OLD.produto_id;

  IF coalesce(produto_aprovado, false) THEN
    SELECT count(*) INTO total_restantes
    FROM public.produto_imagens
    WHERE produto_id = OLD.produto_id
      AND id <> OLD.id;

    IF total_restantes < 1 THEN
      RAISE EXCEPTION 'Um produto aprovado precisa de pelo menos 1 imagem.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_produto_imagens_validar_minimo ON public.produto_imagens;
CREATE TRIGGER trg_produto_imagens_validar_minimo
  BEFORE DELETE ON public.produto_imagens
  FOR EACH ROW
  EXECUTE FUNCTION public.produto_imagens_validar_minimo();

-- ============================================================================
-- GRANTS: sem privilégios implícitos para anon e authenticated.
-- A RLS filtra as linhas; os grants limitam as operações.
-- ============================================================================

REVOKE ALL ON public.produtos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.produto_imagens FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.produtos TO authenticated;

GRANT SELECT ON public.produto_imagens TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.produto_imagens TO authenticated;

-- ============================================================================
-- RLS: produtos
-- ============================================================================

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Público: só produtos aprovados de empresas aprovadas.
DROP POLICY IF EXISTS "produtos_select_publico" ON public.produtos;
CREATE POLICY "produtos_select_publico" ON public.produtos
  FOR SELECT TO anon, authenticated
  USING (
    estado_aprovacao = 'aprovado'
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.is_approved = true
    )
  );

-- Empresa proprietária: vê todos os seus produtos (pendentes e rejeitados incluídos).
DROP POLICY IF EXISTS "produtos_select_proprietario" ON public.produtos;
CREATE POLICY "produtos_select_proprietario" ON public.produtos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.user_id = auth.uid()
    )
  );

-- Só a proprietária da empresa pode criar produtos.
DROP POLICY IF EXISTS "produtos_insert_proprietario" ON public.produtos;
CREATE POLICY "produtos_insert_proprietario" ON public.produtos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produtos_update_proprietario" ON public.produtos;
CREATE POLICY "produtos_update_proprietario" ON public.produtos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produtos_delete_proprietario" ON public.produtos;
CREATE POLICY "produtos_delete_proprietario" ON public.produtos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = produtos.company_id AND c.user_id = auth.uid()
    )
  );

-- Administrador: acesso completo (inclui aprovação e rejeição).
DROP POLICY IF EXISTS "produtos_all_admin" ON public.produtos;
CREATE POLICY "produtos_all_admin" ON public.produtos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- RLS: produto_imagens
-- ============================================================================

ALTER TABLE public.produto_imagens ENABLE ROW LEVEL SECURITY;

-- Público: imagens só de produtos aprovados (a RLS de produtos também se aplica).
DROP POLICY IF EXISTS "produto_imagens_select_publico" ON public.produto_imagens;
CREATE POLICY "produto_imagens_select_publico" ON public.produto_imagens
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      WHERE p.id = produto_imagens.produto_id
        AND p.estado_aprovacao = 'aprovado'
        AND EXISTS (
          SELECT 1 FROM public.companies c
          WHERE c.id = p.company_id AND c.is_approved = true
        )
    )
  );

DROP POLICY IF EXISTS "produto_imagens_select_proprietario" ON public.produto_imagens;
CREATE POLICY "produto_imagens_select_proprietario" ON public.produto_imagens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = produto_imagens.produto_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produto_imagens_insert_proprietario" ON public.produto_imagens;
CREATE POLICY "produto_imagens_insert_proprietario" ON public.produto_imagens
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.produtos p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = produto_imagens.produto_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produto_imagens_update_proprietario" ON public.produto_imagens;
CREATE POLICY "produto_imagens_update_proprietario" ON public.produto_imagens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = produto_imagens.produto_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.produtos p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = produto_imagens.produto_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produto_imagens_delete_proprietario" ON public.produto_imagens;
CREATE POLICY "produto_imagens_delete_proprietario" ON public.produto_imagens
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = produto_imagens.produto_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "produto_imagens_all_admin" ON public.produto_imagens;
CREATE POLICY "produto_imagens_all_admin" ON public.produto_imagens
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- FLUXO DE APROVAÇÃO: função do administrador
-- Aprova ou rejeita. Rejeição exige motivo com 10 ou mais caracteres.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_avaliar_produto(
  p_produto_id uuid,
  p_decisao text,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sem permissão.' USING ERRCODE = '42501';
  END IF;

  IF p_decisao NOT IN ('aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Decisão inválida.' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_decisao = 'rejeitado' AND char_length(btrim(coalesce(p_motivo, ''))) < 10 THEN
    RAISE EXCEPTION 'A rejeição exige um motivo com 10 ou mais caracteres.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  UPDATE public.produtos
  SET estado_aprovacao = p_decisao,
      motivo_rejeicao = CASE WHEN p_decisao = 'rejeitado' THEN btrim(p_motivo) ELSE NULL END,
      avaliado_em = now(),
      avaliado_por = auth.uid()
  WHERE id = p_produto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_avaliar_produto(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_avaliar_produto(uuid, text, text) TO authenticated;

COMMIT;
