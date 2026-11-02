-- =====================================================================
-- Modelos de mensagens automáticas — NegóMapa
-- PREPARADA, NÃO APLICADA.
-- Projeto: sjelyaewgcmmtnudcgem
-- Reversão: supabase/rollback/20261102210000_modelos_mensagem_reversao.sql
--
-- Conteúdo:
--   1. Tabela public.modelos_mensagem: id, tipo, canal, assunto, corpo, ativo, criada_em.
--      Canal: 'email', 'plataforma' ou 'whatsapp'. Um modelo por tipo e canal.
--   2. Modelos iniciais (Tarefa 18B):
--        email e plataforma: boas_vindas, aprovacao_profissional, aprovacao_empresa
--        apenas plataforma:  novo_pedido_servico, nova_candidatura, nova_vaga, nova_avaliacao
--   3. Verificação de e-mail e recuperação de palavra-passe NÃO estão aqui: ficam a cargo do serviço de autenticação.
--   4. RLS: só o administrador lê; escrita apenas por service_role.
--
-- ***************************************************************************
-- AVISO DE REVISÃO FINAL: os textos são uma PROPOSTA. Não foram revistos pelo responsável.
-- Por isso os modelos são inseridos com ativo = false. Só devem ser ativados
-- depois da revisão final dos textos e dos canais.
-- ***************************************************************************
--
-- Os canais são uma suposição, porque o documento não os define.
--
-- Fora do âmbito: envio das mensagens, páginas, componentes, integração com WhatsApp.
-- Marcador de dados semeados: criada_em = 2026-11-02 00:00:00+00 (usado pela reversão).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabela
-- ---------------------------------------------------------------------
CREATE TABLE public.modelos_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN (
    'boas_vindas',
    'novo_pedido_servico',
    'nova_candidatura',
    'aprovacao_profissional',
    'aprovacao_empresa',
    'nova_vaga',
    'nova_avaliacao')),
  canal text NOT NULL CHECK (canal IN ('email', 'plataforma', 'whatsapp')),
  assunto text NULL CHECK (assunto IS NULL OR length(btrim(assunto)) BETWEEN 1 AND 200),
  corpo text NOT NULL CHECK (length(btrim(corpo)) BETWEEN 1 AND 4000),
  ativo boolean NOT NULL DEFAULT true,
  criada_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT modelos_mensagem_tipo_canal_unico UNIQUE (tipo, canal),
  CONSTRAINT modelos_mensagem_email_com_assunto CHECK (canal <> 'email' OR assunto IS NOT NULL)
);

COMMENT ON TABLE public.modelos_mensagem IS
  'Modelos de mensagens automáticas (PROPOSTA: textos por rever, ativo = false). Placeholders entre chavetas. Escrita apenas por service_role.';

-- ---------------------------------------------------------------------
-- Grants e RLS
-- ---------------------------------------------------------------------
REVOKE ALL ON public.modelos_mensagem FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.modelos_mensagem TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos_mensagem TO service_role;

ALTER TABLE public.modelos_mensagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY modelos_mensagem_select_admin ON public.modelos_mensagem
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------
-- 2. Modelos iniciais (PROPOSTA; ativo = false até revisão final)
-- ---------------------------------------------------------------------
INSERT INTO public.modelos_mensagem (tipo, canal, assunto, corpo, ativo, criada_em) VALUES
(
  'boas_vindas', 'email',
  'Bem-vindo(a) à NegóMapa',
  E'Caro(a) {nome},\n\nÉ com satisfação que lhe damos as boas-vindas à NegóMapa, a plataforma que aproxima clientes, profissionais e empresas em Angola.\n\nPode agora concluir o seu perfil e explorar serviços e oportunidades de emprego em {link_plataforma}.\n\nCom os melhores cumprimentos,\nEquipa NegóMapa',
  false, '2026-11-02 00:00:00+00'
),
(
  'boas_vindas', 'plataforma',
  'Bem-vindo(a) à NegóMapa',
  E'Bem-vindo(a) à NegóMapa, {nome}. Pode concluir o seu perfil e começar a explorar serviços e vagas em {link_plataforma}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'aprovacao_profissional', 'email',
  'Perfil profissional aprovado',
  E'Caro(a) {nome},\n\nO seu perfil profissional foi aprovado e já está visível na NegóMapa.\n\nPode consultá-lo em {link_perfil}.\n\nCom os melhores cumprimentos,\nEquipa NegóMapa',
  false, '2026-11-02 00:00:00+00'
),
(
  'aprovacao_profissional', 'plataforma',
  'Perfil profissional aprovado',
  E'O seu perfil profissional foi aprovado e já está visível na NegóMapa. Consulte-o em {link_perfil}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'aprovacao_empresa', 'email',
  'Empresa aprovada',
  E'Caro(a) {nome},\n\nA sua empresa {empresa} foi aprovada e já está visível na NegóMapa. Pode agora publicar vagas em {link_painel}.\n\nCom os melhores cumprimentos,\nEquipa NegóMapa',
  false, '2026-11-02 00:00:00+00'
),
(
  'aprovacao_empresa', 'plataforma',
  'Empresa aprovada',
  E'A sua empresa {empresa} foi aprovada e já está visível na NegóMapa. Pode publicar vagas em {link_painel}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'novo_pedido_servico', 'plataforma',
  'Novo pedido de serviço',
  E'Recebeu um novo pedido de serviço: {titulo}, na província de {provincia}. Consulte os detalhes e responda ao cliente em {link_pedido}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'nova_candidatura', 'plataforma',
  'Nova candidatura a vaga',
  E'Recebeu uma nova candidatura para a vaga {titulo}. Consulte a candidatura em {link_candidatura}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'nova_vaga', 'plataforma',
  'Nova vaga publicada',
  E'Foi publicada uma nova vaga: {titulo}, em {provincia}. Consulte os detalhes em {link_vaga}.',
  false, '2026-11-02 00:00:00+00'
),
(
  'nova_avaliacao', 'plataforma',
  'Nova avaliação recebida',
  E'Recebeu uma nova avaliação de {nota} estrela(s) em {alvo}. Consulte-a em {link_avaliacao}.',
  false, '2026-11-02 00:00:00+00'
);

COMMIT;

-- ---------------------------------------------------------------------
-- Verificações após aplicação (só leitura):
--   a) select tipo, canal, ativo from modelos_mensagem order by tipo, canal -> 10 linhas, todas ativo = false (até revisão)
--   b) has_table_privilege('authenticated','public.modelos_mensagem','INSERT') -> false
--   c) Utilizador não administrador -> 0 linhas em select
-- ---------------------------------------------------------------------
