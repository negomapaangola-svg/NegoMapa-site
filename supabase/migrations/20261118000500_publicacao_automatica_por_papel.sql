begin;

-- A Fase 6 é a fonte de verdade para papel, aprovação e actividade da conta.
-- Publicação é distinta de moderação: utilizadores nunca escolhem o estado.
create or replace function public.proteger_publicacao_vaga()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_account_type text;
  v_active boolean;
begin
  if tg_op = 'INSERT' then
    if v_uid is null or public.is_admin() then
      raise exception 'Administradores e contas sem sessão não podem publicar vagas.'
        using errcode = '42501';
    end if;

    select p.account_type, p.is_active
      into v_account_type, v_active
      from public.profiles p where p.id = v_uid;

    if v_account_type <> 'empresa' or v_active is distinct from true
       or not exists (
         select 1 from public.companies c
          where c.id = new.company_id
            and c.user_id = v_uid
            and c.is_approved is true
            and c.estado = 'aprovado'
       ) then
      raise exception 'Apenas uma conta empresarial activa e aprovada pode publicar vagas.'
        using errcode = '42501';
    end if;

    new.estado := 'aprovado';
    new.motivo_rejeicao := null;
    new.avaliado_em := null;
    new.avaliado_por := null;
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.estado is distinct from old.estado
     or new.motivo_rejeicao is distinct from old.motivo_rejeicao
     or new.avaliado_em is distinct from old.avaliado_em
     or new.avaliado_por is distinct from old.avaliado_por then
    raise exception 'O estado e a moderação das vagas só podem ser alterados pela administração.'
      using errcode = '42501';
  end if;

  select p.account_type, p.is_active
    into v_account_type, v_active
    from public.profiles p where p.id = v_uid;

  if v_account_type <> 'empresa' or v_active is distinct from true
     or not exists (
       select 1 from public.companies c
        where c.id = new.company_id and c.user_id = v_uid
          and c.is_approved is true and c.estado = 'aprovado'
     ) then
    raise exception 'A conta empresarial tem de permanecer activa e aprovada.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_estado_vagas on public.vagas;
create trigger trg_proteger_estado_vagas
before insert or update on public.vagas
for each row execute function public.proteger_publicacao_vaga();

create or replace function public.proteger_publicacao_servico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_account_type text;
  v_active boolean;
  v_ok boolean := false;
begin
  if tg_op = 'INSERT' then
    if v_uid is null or public.is_admin() then
      raise exception 'Administradores e contas sem sessão não podem publicar serviços.'
        using errcode = '42501';
    end if;

    select p.account_type, p.is_active
      into v_account_type, v_active
      from public.profiles p where p.id = v_uid;

    if v_active is distinct from true then
      raise exception 'A conta tem de estar activa para publicar serviços.'
        using errcode = '42501';
    end if;

    if v_account_type = 'profissional' and new.profissional_id is not null
       and new.company_id is null then
      select exists (
        select 1 from public.profissionais p
         where p.id = new.profissional_id and p.user_id = v_uid
           and p.estado = 'aprovado'
      ) into v_ok;
    elsif v_account_type = 'empresa' and new.company_id is not null
       and new.profissional_id is null then
      select exists (
        select 1 from public.companies c
         where c.id = new.company_id and c.user_id = v_uid
           and c.is_approved is true and c.estado = 'aprovado'
      ) into v_ok;
    end if;

    if not v_ok then
      raise exception 'Apenas profissionais ou empresas activas e aprovadas podem publicar serviços.'
        using errcode = '42501';
    end if;

    new.estado := 'aprovado';
    new.motivo_rejeicao := null;
    new.avaliado_em := null;
    new.avaliado_por := null;
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.estado is distinct from old.estado
     or new.motivo_rejeicao is distinct from old.motivo_rejeicao
     or new.avaliado_em is distinct from old.avaliado_em
     or new.avaliado_por is distinct from old.avaliado_por then
    raise exception 'O estado e a moderação dos serviços só podem ser alterados pela administração.'
      using errcode = '42501';
  end if;

  select p.account_type, p.is_active
    into v_account_type, v_active
    from public.profiles p where p.id = v_uid;

  if v_active is distinct from true then
    raise exception 'A conta tem de permanecer activa para gerir serviços.'
      using errcode = '42501';
  end if;

  if v_account_type = 'profissional' and new.profissional_id is not null
     and new.company_id is null then
    select exists (
      select 1 from public.profissionais p
       where p.id = new.profissional_id and p.user_id = v_uid
         and p.estado = 'aprovado'
    ) into v_ok;
  elsif v_account_type = 'empresa' and new.company_id is not null
     and new.profissional_id is null then
    select exists (
      select 1 from public.companies c
       where c.id = new.company_id and c.user_id = v_uid
         and c.is_approved is true and c.estado = 'aprovado'
    ) into v_ok;
  end if;

  if not v_ok then
    raise exception 'A conta tem de permanecer aprovada e ser proprietária do serviço.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_estado_servicos on public.servicos;
create trigger trg_proteger_estado_servicos
before insert or update on public.servicos
for each row execute function public.proteger_publicacao_servico();

-- Produtos mantêm a regra existente de pelo menos uma imagem. A aprovação
-- automática pelo trigger de imagem só é aceite se a empresa já estiver aprovada.
create or replace function public.produtos_proteger_estado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_imagens integer;
  aprovacao_automatica boolean := false;
  v_uid uuid := auth.uid();
  v_account_type text;
  v_active boolean;
  v_company_approved boolean;
begin
  if tg_op = 'INSERT' then
    if v_uid is null or public.is_admin() then
      raise exception 'Administradores e contas sem sessão não podem publicar produtos.'
        using errcode = '42501';
    end if;

    select p.account_type, p.is_active
      into v_account_type, v_active
      from public.profiles p where p.id = v_uid;

    select exists (
      select 1 from public.companies c
       where c.id = new.company_id and c.user_id = v_uid
         and c.is_approved is true and c.estado = 'aprovado'
    ) into v_company_approved;

    if v_account_type <> 'empresa' or v_active is distinct from true
       or not v_company_approved then
      raise exception 'Apenas empresas activas e aprovadas podem publicar produtos.'
        using errcode = '42501';
    end if;

    new.criado_por := v_uid;
    new.estado_aprovacao := 'pendente';
    new.motivo_rejeicao := null;
    new.avaliado_em := null;
    new.avaliado_por := null;
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.estado_aprovacao is distinct from old.estado_aprovacao
     or new.motivo_rejeicao is distinct from old.motivo_rejeicao
     or new.avaliado_em is distinct from old.avaliado_em
     or new.avaliado_por is distinct from old.avaliado_por then
    if new.estado_aprovacao = 'aprovado'
       and pg_trigger_depth() > 1
       and exists (
         select 1 from public.produto_imagens pi where pi.produto_id = new.id
       ) then
      select exists (
        select 1 from public.companies c
         where c.id = new.company_id and c.user_id = v_uid
           and c.is_approved is true and c.estado = 'aprovado'
           and negomapa_private.is_account_active(c.user_id)
      ) into v_company_approved;
      if v_company_approved then
        aprovacao_automatica := true;
      else
        new.estado_aprovacao := 'pendente';
      end if;
    else
      raise exception 'Sem permissão para alterar a aprovação do produto.'
        using errcode = '42501';
    end if;
  end if;

  if new.company_id is distinct from old.company_id
     or new.criado_por is distinct from old.criado_por then
    raise exception 'A empresa e o criador do produto não podem ser alterados.'
      using errcode = '42501';
  end if;

  if not public.is_admin() then
    select p.account_type, p.is_active
      into v_account_type, v_active
      from public.profiles p where p.id = v_uid;
    select exists (
      select 1 from public.companies c
       where c.id = new.company_id and c.user_id = v_uid
         and c.is_approved is true and c.estado = 'aprovado'
         and negomapa_private.is_account_active(c.user_id)
    ) into v_company_approved;
    if v_account_type <> 'empresa' or v_active is distinct from true
       or not v_company_approved then
      raise exception 'A conta empresarial tem de permanecer activa e aprovada.'
        using errcode = '42501';
    end if;
  end if;

  if aprovacao_automatica then
    new.motivo_rejeicao := null;
    new.avaliado_em := now();
    new.avaliado_por := null;
  end if;

  if new.estado_aprovacao = 'aprovado'
     and (tg_op = 'INSERT' or new.estado_aprovacao is distinct from old.estado_aprovacao) then
    select count(*) into total_imagens
      from public.produto_imagens where produto_id = new.id;
    if total_imagens < 1 then
      raise exception 'O produto precisa de pelo menos 1 imagem para ser publicado.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

commit;
