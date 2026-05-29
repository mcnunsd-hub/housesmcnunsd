
-- Admin policies for missions
CREATE POLICY "Admins manage missions insert" ON public.missions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage missions update" ON public.missions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage missions delete" ON public.missions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read all missions" ON public.missions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for trivia_questions
CREATE POLICY "Admins insert trivia" ON public.trivia_questions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update trivia" ON public.trivia_questions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete trivia" ON public.trivia_questions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for app_settings
CREATE POLICY "Admins upsert settings insert" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upsert settings update" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies for user_roles management
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES ('scores_locked', 'false')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('trivia_unlocked', 'true')
  ON CONFLICT (key) DO NOTHING;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_checkin_tokens_token ON public.checkin_tokens(token);
CREATE INDEX IF NOT EXISTS idx_checkin_tokens_expires ON public.checkin_tokens(expires_at);
