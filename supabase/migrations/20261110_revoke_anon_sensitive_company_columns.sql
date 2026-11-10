-- Remove acesso anónimo a campos sensíveis de empresas.
-- A vista pública empresas_publicas continua responsável pelos dados públicos.
-- Reversão de emergência:
-- GRANT SELECT (email, phone, estado_legalizacao)
-- ON public.companies
-- TO anon;

REVOKE SELECT (email, phone, estado_legalizacao)
ON public.companies
FROM anon;
