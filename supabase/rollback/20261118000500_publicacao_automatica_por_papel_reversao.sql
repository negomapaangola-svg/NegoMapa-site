begin;

-- Restaura o comportamento anterior dos estados de vagas e serviços.
create or replace function public.proteger_estado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name in ('servicos', 'vagas') then
    if tg_op = 'INSERT' then
      new.estado := 'aprovado';
      return new;
    end if;
    if public.is_admin() then return new; end if;
    if new.estado is distinct from old.estado then
      raise exception 'Apenas administradores podem alterar o estado';
    end if;
    return new;
  end if;
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.estado := 'pendente';
    return new;
  end if;
  if new.estado is distinct from old.estado then
    raise exception 'Apenas administradores podem alterar o estado';
  end if;
  return new;
end;
$$;

create or replace function public.proteger_estado_servico()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (current_user = 'postgres' and session_user = 'postgres')
     or current_user = 'service_role'
     or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.estado := 'pendente';
    return new;
  end if;
  if new.estado is distinct from old.estado then
    raise exception 'Apenas administradores podem alterar o estado do serviço';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_estado_vagas on public.vagas;
create trigger trg_proteger_estado_vagas before insert or update on public.vagas
for each row execute function public.proteger_estado();

drop trigger if exists trg_proteger_estado_servicos on public.servicos;
create trigger trg_proteger_estado_servicos before insert or update on public.servicos
for each row execute function public.proteger_estado_servico();

-- A definição original de produtos_proteger_estado deve ser recuperada
-- da migração que a introduziu caso seja necessário reverter este hardening.
commit;
