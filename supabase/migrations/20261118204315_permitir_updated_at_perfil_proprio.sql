begin;

-- PostgREST envia updated_at juntamente com os campos editáveis do perfil.
-- Concede apenas essa coluna adicional; account_type/is_admin continuam sem
-- UPDATE para authenticated e a RLS continua a limitar a linha ao próprio user.
grant update (updated_at) on table public.profiles to authenticated;

commit;
