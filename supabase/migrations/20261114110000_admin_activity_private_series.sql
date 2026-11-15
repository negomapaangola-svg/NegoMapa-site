-- Séries temporais administrativas sem expor conteúdo de mensagens nem perfis.
-- A função devolve apenas contagens diárias e exige autorização canónica de admin.
-- Esta migração fica versionada no repositório; não é aplicada à produção nesta tarefa.

CREATE OR REPLACE FUNCTION public.admin_activity_private_series(
  p_start_date date,
  p_days integer DEFAULT 90
)
RETURNS TABLE (
  metric text,
  activity_date date,
  value bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  IF p_days NOT IN (7, 30, 90)
     OR p_start_date IS NULL
     OR p_start_date > current_date
     OR p_start_date < current_date - 100 THEN
    RAISE EXCEPTION 'Intervalo inválido' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generated_day::date AS activity_date
      FROM generate_series(
        p_start_date::timestamp,
        (p_start_date + (p_days - 1))::timestamp,
        interval '1 day'
      ) AS generated_day
  )
  SELECT
    'accounts'::text,
    d.activity_date,
    count(p.id)::bigint
  FROM days AS d
  LEFT JOIN public.profiles AS p
    ON p.created_at >= (d.activity_date::timestamp AT TIME ZONE 'UTC')
   AND p.created_at < ((d.activity_date + 1)::timestamp AT TIME ZONE 'UTC')
  GROUP BY d.activity_date

  UNION ALL

  SELECT
    'messages'::text,
    d.activity_date,
    count(m.id)::bigint
  FROM days AS d
  LEFT JOIN public.mensagens AS m
    ON m.criada_em >= (d.activity_date::timestamp AT TIME ZONE 'UTC')
   AND m.criada_em < ((d.activity_date + 1)::timestamp AT TIME ZONE 'UTC')
  GROUP BY d.activity_date;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_activity_private_series(date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_activity_private_series(date, integer) TO authenticated;
