-- Remove privilégios de escrita de anon em companies.
-- O cadastro de empresas é executado por Server Action com sessão autenticada;
-- os fluxos públicos de leitura usam a vista empresas_publicas.
-- Mantém os privilégios de authenticated e as políticas RLS inalterados.
-- Não altera dados, coordenadas, vistas, funções ou triggers.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE public.companies
FROM anon;
