-- Fase C2 — coordenadas aproximadas de prestadores
-- Preparada para revisão; NÃO aplicar em produção.
--
-- As coordenadas são opcionais e devem ser arredondadas a duas casas
-- decimais pela aplicação antes de serem guardadas.
-- A utilização destina-se exclusivamente ao cálculo server-side
-- de distâncias aproximadas.
--
-- Estas colunas não devem ser adicionadas às vistas públicas.
-- Esta migração não concede privilégios a anon ou authenticated
-- e não altera políticas RLS, autenticação, triggers ou funções.

begin;

alter table public.profissionais
  add column if not exists latitude_aproximada numeric(5,2),
  add column if not exists longitude_aproximada numeric(6,2);

alter table public.companies
  add column if not exists latitude_aproximada numeric(5,2),
  add column if not exists longitude_aproximada numeric(6,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profissionais'::regclass
      and conname = 'profissionais_localizacao_aproximada_valida'
  ) then
    alter table public.profissionais
      add constraint profissionais_localizacao_aproximada_valida
      check (
        (
          latitude_aproximada is null
          and longitude_aproximada is null
        )
        or (
          latitude_aproximada is not null
          and longitude_aproximada is not null
          and latitude_aproximada between -90 and 90
          and longitude_aproximada between -180 and 180
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.companies'::regclass
      and conname = 'companies_localizacao_aproximada_valida'
  ) then
    alter table public.companies
      add constraint companies_localizacao_aproximada_valida
      check (
        (
          latitude_aproximada is null
          and longitude_aproximada is null
        )
        or (
          latitude_aproximada is not null
          and longitude_aproximada is not null
          and latitude_aproximada between -90 and 90
          and longitude_aproximada between -180 and 180
        )
      );
  end if;
end
$$;

comment on column public.profissionais.latitude_aproximada is
  'Latitude arredondada a duas casas; uso exclusivo server-side para distância aproximada.';

comment on column public.profissionais.longitude_aproximada is
  'Longitude arredondada a duas casas; uso exclusivo server-side para distância aproximada.';

comment on column public.companies.latitude_aproximada is
  'Latitude arredondada a duas casas; uso exclusivo server-side para distância aproximada.';

comment on column public.companies.longitude_aproximada is
  'Longitude arredondada a duas casas; uso exclusivo server-side para distância aproximada.';

commit;
