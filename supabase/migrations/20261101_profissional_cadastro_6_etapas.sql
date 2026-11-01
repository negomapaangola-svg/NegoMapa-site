-- NÃO APLICADA. Aguarda autorização.
-- Colunas necessárias ao cadastro de profissional em 6 etapas.
-- Não altera profissionais.estado (trigger proteger_estado mantém-se), não remove colunas,
-- mantém bi_numero.

ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS especialidades text[],
  ADD COLUMN IF NOT EXISTS experiencia_faixa text
    CHECK (experiencia_faixa IS NULL OR experiencia_faixa IN ('menos_1','1_3','3_5','mais_5')),
  ADD COLUMN IF NOT EXISTS faixa_preco_desde text,
  ADD COLUMN IF NOT EXISTS disponibilidade text
    CHECK (disponibilidade IS NULL OR disponibilidade IN ('disponivel','ocupado','indisponivel')),
  ADD COLUMN IF NOT EXISTS bi_foto_path text;

COMMENT ON COLUMN public.profissionais.bi_foto_path IS
  'Caminho em documentos-privados (<user_id>/bi-...). Privado: sem SELECT para anon/authenticated.';

-- A tabela usa GRANTs por coluna. Colunas novas NÃO herdam privilégios automaticamente.
-- Públicas (perfil aprovado): leitura para anon e authenticated.
GRANT SELECT (bairro, categoria_id, especialidades, experiencia_faixa, faixa_preco_desde, disponibilidade)
  ON public.profissionais TO anon, authenticated;

-- Escrita: só authenticated (RLS profissionais_insert_auth / profissionais_update_auth limita ao dono).
GRANT INSERT (bairro, categoria_id, especialidades, experiencia_faixa, faixa_preco_desde, disponibilidade, bi_foto_path)
  ON public.profissionais TO authenticated;
GRANT UPDATE (bairro, categoria_id, especialidades, experiencia_faixa, faixa_preco_desde, disponibilidade, bi_foto_path)
  ON public.profissionais TO authenticated;

-- bi_foto_path: nenhum SELECT concedido (nem ao dono). Leitura pelo dono será feita por função
-- SECURITY DEFINER, como obter_bi_proprio (20261028). Não concedido a anon.
