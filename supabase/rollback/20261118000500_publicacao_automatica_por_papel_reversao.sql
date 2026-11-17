begin;

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

CREATE OR REPLACE FUNCTION public.produtos_proteger_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total_imagens integer;
  aprovacao_automatica boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.criado_por := auth.uid();
      NEW.estado_aprovacao := 'pendente';
      NEW.motivo_rejeicao := NULL;
      NEW.avaliado_em := NULL;
      NEW.avaliado_por := NULL;
    ELSE
      IF NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao
         OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao
         OR NEW.avaliado_em IS DISTINCT FROM OLD.avaliado_em
         OR NEW.avaliado_por IS DISTINCT FROM OLD.avaliado_por THEN
        IF NEW.estado_aprovacao = 'aprovado'
           AND pg_trigger_depth() > 1
           AND EXISTS (
             SELECT 1 FROM public.produto_imagens pi
              WHERE pi.produto_id = NEW.id
           ) THEN
          aprovacao_automatica := true;
        ELSE
          RAISE EXCEPTION 'Sem permissão para alterar a aprovação do produto.'
            USING ERRCODE = '42501';
        END IF;
      END IF;

      IF NEW.company_id IS DISTINCT FROM OLD.company_id
         OR NEW.criado_por IS DISTINCT FROM OLD.criado_por THEN
        RAISE EXCEPTION 'Sem permissão para alterar a empresa ou o criador do produto.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF aprovacao_automatica THEN
    NEW.motivo_rejeicao := NULL;
    NEW.avaliado_em := now();
    NEW.avaliado_por := NULL;
  END IF;

  IF NEW.estado_aprovacao = 'aprovado'
     AND (TG_OP = 'INSERT' OR NEW.estado_aprovacao IS DISTINCT FROM OLD.estado_aprovacao) THEN
    SELECT count(*) INTO total_imagens
      FROM public.produto_imagens
     WHERE produto_id = NEW.id;

    IF total_imagens < 1 THEN
      RAISE EXCEPTION 'O produto precisa de pelo menos 1 imagem para ser publicado.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

drop trigger if exists trg_proteger_estado_vagas on public.vagas;
create trigger trg_proteger_estado_vagas before insert or update on public.vagas
for each row execute function public.proteger_estado();

drop trigger if exists trg_proteger_estado_servicos on public.servicos;
create trigger trg_proteger_estado_servicos before insert or update on public.servicos
for each row execute function public.proteger_estado_servico();

drop function if exists public.proteger_publicacao_vaga();
drop function if exists public.proteger_publicacao_servico();

commit;
