begin;

create table public.conta_detalhes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  formacao text null check (formacao is null or char_length(btrim(formacao)) <= 2000),
  preferencias text null check (preferencias is null or char_length(btrim(preferencias)) <= 2000),
  disponibilidade text null check (disponibilidade is null or char_length(btrim(disponibilidade)) <= 500),
  tipo_empresa text null check (tipo_empresa is null or char_length(btrim(tipo_empresa)) <= 120),
  tamanho_empresa text null check (tamanho_empresa is null or char_length(btrim(tamanho_empresa)) <= 80),
  updated_at timestamptz not null default now()
);

comment on table public.conta_detalhes is
  'Campos complementares privados do painel de conta. Cada utilizador só pode aceder à linha cujo user_id corresponde a auth.uid().';

alter table public.conta_detalhes enable row level security;
revoke all on public.conta_detalhes from public, anon, authenticated;
grant select, insert, update, delete on public.conta_detalhes to authenticated;
grant select, insert, update, delete on public.conta_detalhes to service_role;

create policy conta_detalhes_select_own on public.conta_detalhes
  for select to authenticated using (user_id = (select auth.uid()));
create policy conta_detalhes_insert_own on public.conta_detalhes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy conta_detalhes_update_own on public.conta_detalhes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy conta_detalhes_delete_own on public.conta_detalhes
  for delete to authenticated using (user_id = (select auth.uid()));

commit;
