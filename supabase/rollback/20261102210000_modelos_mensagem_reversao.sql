-- =====================================================================
-- REVERSÃO — modelos de mensagens (migração 20261102210000)
-- NÃO APLICADA. Executar só se a migração tiver sido aplicada e for preciso voltar atrás.
--
-- Remove a tabela modelos_mensagem (com policy, constraints e grants).
-- A versão 18B semeia 10 linhas (boas_vindas, aprovacao_profissional e aprovacao_empresa em email e plataforma;
-- novo_pedido_servico, nova_candidatura, nova_vaga e nova_avaliacao em plataforma), todas com ativo = false.
-- Aborta se existir algum modelo que não seja o semeado pela migração
-- (criada_em diferente de 2026-11-02 00:00:00+00), para não apagar edições feitas depois.
-- Não há modelos de verificação de e-mail nem de recuperação de palavra-passe (ficam no serviço de autenticação).
-- =====================================================================

BEGIN;

DO $pre$
DECLARE
  v_n bigint;
BEGIN
  IF to_regclass('public.modelos_mensagem') IS NULL THEN
    RAISE NOTICE 'Tabela public.modelos_mensagem não existe. Nada a reverter.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_n
    FROM public.modelos_mensagem
   WHERE criada_em IS DISTINCT FROM '2026-11-02 00:00:00+00'::timestamptz;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'Reversão cancelada: % modelo(s) não semeado(s) pela migração. Decidir antes o que fazer.', v_n;
  END IF;
END
$pre$;

DROP TABLE IF EXISTS public.modelos_mensagem;

COMMIT;
