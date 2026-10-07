-- Profiles: users cannot set house/sorted_at themselves
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (id, full_name, committee, country, seniority_tier, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, committee, country, seniority_tier, updated_at) ON public.profiles TO authenticated;

-- Trivia answers/sessions: writes only from server
REVOKE INSERT, UPDATE, DELETE ON public.trivia_answers FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.trivia_sessions FROM authenticated;
GRANT ALL ON public.trivia_answers TO service_role;
GRANT ALL ON public.trivia_sessions TO service_role;

-- Trivia questions: only admins read (correct answers)
DROP POLICY IF EXISTS "Trivia questions readable" ON public.trivia_questions;
CREATE POLICY "Admins read trivia" ON public.trivia_questions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- App settings: only public flags readable
DROP POLICY IF EXISTS "Settings readable" ON public.app_settings;
CREATE POLICY "Public flags readable" ON public.app_settings FOR SELECT TO authenticated
  USING (key IN ('trivia_unlocked','scores_locked') OR public.is_admin(auth.uid()));

-- Check-in events: own or staff/admin
DROP POLICY IF EXISTS "Check-ins readable" ON public.checkin_events;
CREATE POLICY "Own or staff read check-ins" ON public.checkin_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

-- Score events: own or staff/admin; aggregates via definer functions
DROP POLICY IF EXISTS "Score events readable" ON public.score_events;
CREATE POLICY "Own or staff read score events" ON public.score_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff_or_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.house_totals()
RETURNS TABLE(house house, total_points bigint, delegate_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT h.house,
    COALESCE((SELECT sum(points) FROM public.score_events s WHERE s.house = h.house),0)::bigint,
    (SELECT count(*) FROM public.profiles p WHERE p.house = h.house)::bigint
  FROM unnest(enum_range(NULL::house)) AS h(house)
  WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.house_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.house_totals() TO authenticated;

CREATE OR REPLACE FUNCTION public.leaderboard_feed(_limit int DEFAULT 20)
RETURNS TABLE(id uuid, house house, source text, points int, created_at timestamptz, delegate_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.house, s.source, s.points, s.created_at, p.full_name
  FROM public.score_events s LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE auth.uid() IS NOT NULL
  ORDER BY s.created_at DESC LIMIT LEAST(GREATEST(_limit,1),50)
$$;
REVOKE ALL ON FUNCTION public.leaderboard_feed(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_feed(int) TO authenticated;

-- Delegations: only those of active committees (or admins)
DROP POLICY IF EXISTS "Delegations readable" ON public.delegations;
CREATE POLICY "Delegations of active committees readable" ON public.delegations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.committees c WHERE c.id = committee_id AND c.active));

-- Mesa roster: admins or own claimed row; open seats via function
DROP POLICY IF EXISTS "Roster readable" ON public.mesa_roster;
CREATE POLICY "Own roster row readable" ON public.mesa_roster FOR SELECT TO authenticated
  USING (claimed_by = auth.uid());

CREATE OR REPLACE FUNCTION public.available_mesa_roster()
RETURNS TABLE(id uuid, full_name text, committee_id uuid, "position" text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.full_name, r.committee_id, r.position FROM public.mesa_roster r
  WHERE r.claimed_by IS NULL AND auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.available_mesa_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.available_mesa_roster() TO authenticated;