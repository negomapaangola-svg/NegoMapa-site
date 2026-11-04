-- Adiciona o contacto (telefone, WhatsApp ou email) à candidatura.
-- A coluna é nullable: candidaturas antigas ficam sem contacto.
-- A obrigatoriedade é garantida na aplicação (cliente e servidor) para novas candidaturas.
-- Não há alterações de RLS nem de grants: os grants de tabela já cobrem a nova coluna.

ALTER TABLE public.candidaturas
  ADD COLUMN IF NOT EXISTS contacto text NULL;

ALTER TABLE public.candidaturas
  DROP CONSTRAINT IF EXISTS candidaturas_contacto_tamanho;

ALTER TABLE public.candidaturas
  ADD CONSTRAINT candidaturas_contacto_tamanho
  CHECK (contacto IS NULL OR char_length(btrim(contacto)) BETWEEN 5 AND 120);

COMMENT ON COLUMN public.candidaturas.contacto IS
  'Contacto indicado pelo candidato (telefone, WhatsApp ou email). Visível apenas à empresa dona da vaga.';
