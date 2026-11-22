begin;
revoke all on function public.get_my_company_profile() from public, anon, authenticated;
drop function if exists public.get_my_company_profile();
revoke all on function public.get_my_professional_account() from public, anon, authenticated;
drop function if exists public.get_my_professional_account();
commit;
