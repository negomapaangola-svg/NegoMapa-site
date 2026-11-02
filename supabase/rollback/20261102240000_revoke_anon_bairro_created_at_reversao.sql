-- =====================================================================
-- REVERSÃO — repõe o SELECT de anon em profissionais.bairro e profissionais.created_at
-- (reverte 20261102240000). Repõe exatamente os grants que existiam antes do REVOKE.
-- =====================================================================

BEGIN;

GRANT SELECT (bairro, created_at) ON public.profissionais TO anon;

COMMIT;
