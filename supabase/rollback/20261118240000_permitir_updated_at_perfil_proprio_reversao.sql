begin;

-- Restaura o conjunto de privilégios anterior à migração.
revoke update (updated_at) on table public.profiles from authenticated;

commit;
