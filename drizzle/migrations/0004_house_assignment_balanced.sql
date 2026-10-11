CREATE TABLE public.house_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  house house NOT NULL,
  previous_house house,
  method text NOT NULL DEFAULT 'algorithm',
  reason text,
  fit_scores jsonb,
  answers jsonb,
  cohort_snapshot jsonb,
  seed text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.house_assignments TO authenticated;
GRANT ALL ON public.house_assignments TO service_role;
ALTER TABLE public.house_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read assignments" ON public.house_assignments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.house_cohort_counts(_user_id uuid)
RETURNS TABLE(house house, total bigint, same_level bigint, same_committee bigint, same_school bigint, same_type bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH me AS (SELECT * FROM public.participants WHERE user_id = _user_id)
  SELECT h.house,
    count(p.id),
    count(p.id) FILTER (WHERE pa.experience IS NOT DISTINCT FROM (SELECT experience FROM me)),
    count(p.id) FILTER (WHERE pa.committee_id IS NOT NULL AND pa.committee_id = (SELECT committee_id FROM me)),
    count(p.id) FILTER (WHERE pa.school IS NOT NULL AND lower(trim(pa.school)) = lower(trim((SELECT school FROM me)))),
    count(p.id) FILTER (WHERE pa.participant_type = (SELECT participant_type FROM me))
  FROM unnest(enum_range(NULL::house)) AS h(house)
  LEFT JOIN public.profiles p ON p.house = h.house AND p.id <> _user_id
  LEFT JOIN public.participants pa ON pa.user_id = p.id
  GROUP BY h.house
$$;
REVOKE EXECUTE ON FUNCTION public.house_cohort_counts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.house_cohort_counts(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_override_house(_user_id uuid, _house house, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _prev house;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Motivo requerido'; END IF;
  IF EXISTS (SELECT 1 FROM public.app_settings WHERE key='houses_locked' AND value='true') THEN
    RAISE EXCEPTION 'Las Houses están bloqueadas';
  END IF;
  SELECT house INTO _prev FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE public.profiles SET house = _house, sorted_at = coalesce(sorted_at, now()), updated_at = now() WHERE id = _user_id;
  INSERT INTO public.house_assignments(user_id, house, previous_house, method, reason, actor_id)
  VALUES (_user_id, _house, _prev, 'admin_override', _reason, auth.uid());
  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, before, after, reason)
  VALUES (auth.uid(), 'HOUSE_OVERRIDE', 'profiles', _user_id::text, jsonb_build_object('house', _prev), jsonb_build_object('house', _house), _reason);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_override_house(uuid, house, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_override_house(uuid, house, text) TO authenticated;

DROP POLICY IF EXISTS "Public flags readable" ON public.app_settings;
CREATE POLICY "Public flags readable" ON public.app_settings FOR SELECT TO authenticated
  USING (key = ANY (ARRAY['trivia_unlocked','scores_locked','houses_locked']) OR public.is_admin(auth.uid()));