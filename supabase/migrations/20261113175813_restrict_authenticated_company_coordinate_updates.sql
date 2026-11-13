-- Tentativa inicial de revogação por coluna.
-- A migração seguinte remove também o UPDATE ao nível da tabela, que prevalece
-- sobre privilégios de coluna, e reabre apenas as restantes colunas.
REVOKE UPDATE (latitude_aproximada, longitude_aproximada)
ON TABLE public.companies
FROM authenticated;
