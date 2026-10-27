-- Impede que um utilizador altere a própria flag is_admin em public.profiles.
-- Aplicado em produção (registo: 20261027201608 protect_profiles_is_admin).
-- Corresponde ao estado confirmado: WITH CHECK exige id = auth.uid() e
-- is_admin igual ao valor actual na linha.
--
-- Reversão: a definição anterior da política não está registada neste repositório.
-- Antes de reverter, confirmar a definição original em produção (histórico do projecto).

ALTER POLICY users_update_own_profile ON public.profiles
  WITH CHECK (
    id = (SELECT auth.uid())
    AND is_admin IS NOT DISTINCT FROM (
      SELECT p.is_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid())
    )
  );
