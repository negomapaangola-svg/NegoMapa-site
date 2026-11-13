-- Corrige as permissões de edição da localização privada do próprio perfil.
-- A política RLS existente users_update_own_profile continua a limitar a linha a auth.uid().
-- Não concede permissões sobre account_type, is_admin ou dados de outros utilizadores.
GRANT UPDATE (
  localizacao_provincia,
  localizacao_municipio,
  localizacao_bairro,
  consentimento_localizacao,
  consentimento_actualizado_em,
  latitude_aproximada,
  longitude_aproximada
) ON TABLE public.profiles TO authenticated;
