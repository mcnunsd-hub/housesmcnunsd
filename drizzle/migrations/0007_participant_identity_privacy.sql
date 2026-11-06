CREATE TABLE public.houses (id public.house PRIMARY KEY, name text NOT NULL UNIQUE, color_name text NOT NULL, CONSTRAINT houses_official_name CHECK (name = upper(id::text)));
GRANT SELECT ON public.houses TO authenticated;
GRANT ALL ON public.houses TO service_role;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Official Houses readable" ON public.houses FOR SELECT TO authenticated USING (true);

ALTER TABLE public.participants ADD COLUMN email text;
ALTER TABLE public.participants ADD COLUMN participant_group text;
ALTER TABLE public.participants ADD COLUMN participant_id_stable uuid GENERATED ALWAYS AS (user_id) STORED;
ALTER TABLE public.participants ADD COLUMN id uuid GENERATED ALWAYS AS (user_id) STORED;
ALTER TABLE public.participants ADD COLUMN delegation_or_school text GENERATED ALWAYS AS (school) STORED;
ALTER TABLE public.participants ADD COLUMN approval_status text GENERATED ALWAYS AS (CASE status WHEN 'active' THEN 'approved' ELSE status END) STORED;
UPDATE public.participants SET participant_group = participant_type WHERE participant_group IS NULL;
ALTER TABLE public.participants ADD CONSTRAINT participants_group_valid CHECK (participant_group IN ('delegado','mesa','advisor','profesor','staff','departamento'));
CREATE UNIQUE INDEX participants_stable_identity_unique ON public.participants(participant_id_stable);
COMMENT ON COLUMN public.participants.participant_id_stable IS 'Immutable account UUID for future integration; never regenerated.';
COMMENT ON COLUMN public.participants.approval_status IS 'Compatible projection: active maps to approved; existing onboarding status stays authoritative.';
COMMENT ON COLUMN public.participants.email IS 'Optional contact email; private owner/admin access only.';

CREATE FUNCTION public.sync_participant_group() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN NEW.participant_group := coalesce(NEW.participant_group, NEW.participant_type);
 ELSIF NEW.participant_type IS DISTINCT FROM OLD.participant_type AND NEW.participant_group IS NOT DISTINCT FROM OLD.participant_group THEN NEW.participant_group := NEW.participant_type;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_participant_group() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_participant_group BEFORE INSERT OR UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.sync_participant_group();

DROP POLICY "Admins grant roles" ON public.user_roles;
CREATE POLICY "Admins grant roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id <> auth.uid() AND ((role::text IN ('delegate','mesa','profesor','staff','validator','participant') AND public.is_admin(auth.uid())) OR (role::text IN ('admin','super_admin') AND public.is_super_admin(auth.uid()))));
DROP POLICY "Admins revoke roles" ON public.user_roles;
CREATE POLICY "Admins revoke roles" ON public.user_roles FOR DELETE TO authenticated USING (user_id <> auth.uid() AND ((role::text IN ('delegate','mesa','profesor','staff','validator','participant') AND public.is_admin(auth.uid())) OR (role::text IN ('admin','super_admin') AND public.is_super_admin(auth.uid()))));
REVOKE UPDATE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.participants FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.is_admin(auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
CREATE POLICY "Academic affiliation firewall" ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()) OR (NOT public.has_role(auth.uid(),'mesa') AND NOT public.has_role(auth.uid(),'delegate') AND NOT public.has_role(auth.uid(),'participant')));
CREATE POLICY "Academic score identity firewall" ON public.score_events AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()) OR (NOT public.has_role(auth.uid(),'mesa') AND NOT public.has_role(auth.uid(),'delegate') AND NOT public.has_role(auth.uid(),'participant')));

CREATE FUNCTION public.scores_are_locked() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT coalesce((SELECT value <> 'false' FROM public.app_settings WHERE key = 'scores_locked'), false) $$;
REVOKE ALL ON FUNCTION public.scores_are_locked() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.scores_are_locked() TO authenticated;
CREATE POLICY "Scores hidden while locked" ON public.score_events AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR NOT public.scores_are_locked());
CREATE OR REPLACE FUNCTION public.house_totals() RETURNS TABLE(house public.house, total_points bigint, delegate_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT h.house, coalesce((SELECT sum(s.points) FROM public.score_events s WHERE s.house=h.house),0)::bigint, (SELECT count(*) FROM public.profiles p WHERE p.house=h.house)::bigint
 FROM unnest(enum_range(NULL::public.house)) AS h(house)
 WHERE auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR NOT public.scores_are_locked())
$$;
REVOKE ALL ON FUNCTION public.house_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.house_totals() TO authenticated;
CREATE OR REPLACE FUNCTION public.leaderboard_feed(_limit integer DEFAULT 20) RETURNS TABLE(id uuid, house public.house, source text, points integer, created_at timestamptz, delegate_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT md5(s.house::text || ':' || (s.created_at AT TIME ZONE 'UTC')::date::text)::uuid, s.house, 'Actividad de House'::text, sum(s.points)::integer, ((s.created_at AT TIME ZONE 'UTC')::date::timestamp AT TIME ZONE 'UTC'), 'House'::text
 FROM public.score_events s WHERE auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR NOT public.scores_are_locked())
 GROUP BY s.house, (s.created_at AT TIME ZONE 'UTC')::date ORDER BY (s.created_at AT TIME ZONE 'UTC')::date DESC, s.house LIMIT LEAST(GREATEST(_limit,1),50)
$$;
REVOKE ALL ON FUNCTION public.leaderboard_feed(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_feed(integer) TO authenticated;
CREATE OR REPLACE VIEW public.house_scores WITH (security_invoker=true) AS SELECT house,total_points,delegate_count FROM public.house_totals();
REVOKE ALL ON public.house_scores FROM anon;
GRANT SELECT ON public.house_scores TO authenticated;
COMMENT ON FUNCTION public.leaderboard_feed(integer) IS 'House/day aggregates only; no participant names, user IDs, original event IDs or precise earning timestamps.';