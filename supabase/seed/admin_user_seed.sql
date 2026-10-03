-- Seed opcional: Inserir administrador inicial
-- Projeto: NegóMapa
-- Data: 2026-10-03
--
-- Este ficheiro NÃO é executado automaticamente pelas migrações.
-- Execute manualmente no SQL Editor do Supabase se necessário.

INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users
WHERE email = 'negomapaangola@gmail.com'
ON CONFLICT (user_id) DO NOTHING;