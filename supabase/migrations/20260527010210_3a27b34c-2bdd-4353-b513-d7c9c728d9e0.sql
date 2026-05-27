
-- App settings (admin lock flag, etc.)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings readable" ON public.app_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.app_settings (key, value) VALUES ('scores_locked', 'false') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('trivia_unlocked', 'false') ON CONFLICT (key) DO NOTHING;

-- Trivia questions
CREATE TABLE public.trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  points INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trivia_questions_order_idx ON public.trivia_questions(order_index);
GRANT SELECT ON public.trivia_questions TO authenticated;
GRANT ALL ON public.trivia_questions TO service_role;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trivia questions readable" ON public.trivia_questions FOR SELECT TO authenticated USING (true);

-- Trivia sessions
CREATE TABLE public.trivia_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_score INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trivia_sessions_user_idx ON public.trivia_sessions(user_id);
GRANT SELECT, INSERT, UPDATE ON public.trivia_sessions TO authenticated;
GRANT ALL ON public.trivia_sessions TO service_role;
ALTER TABLE public.trivia_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON public.trivia_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Trivia answers
CREATE TABLE public.trivia_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.trivia_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.trivia_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('A','B','C','D')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trivia_answers_session_idx ON public.trivia_answers(session_id);
GRANT SELECT, INSERT ON public.trivia_answers TO authenticated;
GRANT ALL ON public.trivia_answers TO service_role;
ALTER TABLE public.trivia_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own answers" ON public.trivia_answers FOR ALL TO authenticated USING (auth.uid() = user_id);

-- House scores view (aggregates from score_events)
CREATE OR REPLACE VIEW public.house_scores AS
SELECT 
  house,
  COALESCE(SUM(points), 0) AS total_points,
  COUNT(DISTINCT user_id) AS delegate_count
FROM public.score_events
GROUP BY house;

GRANT SELECT ON public.house_scores TO authenticated;
GRANT ALL ON public.house_scores TO service_role;

INSERT INTO public.trivia_questions (question_text, options, correct_answer, points, order_index) VALUES
('Which UN body is primarily responsible for maintaining international peace and security?', '[{"letter":"A","text":"UN General Assembly"},{"letter":"B","text":"UN Security Council"},{"letter":"C","text":"International Court of Justice"},{"letter":"D","text":"UN Human Rights Council"}]', 'B', 10, 1),
('The principle of "Responsibility to Protect" (R2P) was adopted at which World Summit?', '[{"letter":"A","text":"Rio Earth Summit 1992"},{"letter":"B","text":"Millennium Summit 2000"},{"letter":"C","text":"2005 World Summit"},{"letter":"D","text":"Paris Climate Summit 2015"}]', 'C', 10, 2),
('Which country hosts the headquarters of the International Atomic Energy Agency (IAEA)?', '[{"letter":"A","text":"Switzerland"},{"letter":"B","text":"Austria"},{"letter":"C","text":"Germany"},{"letter":"D","text":"Netherlands"}]', 'B', 10, 3),
('The Treaty on the Non-Proliferation of Nuclear Weapons (NPT) entered into force in which year?', '[{"letter":"A","text":"1968"},{"letter":"B","text":"1970"},{"letter":"C","text":"1975"},{"letter":"D","text":"1980"}]', 'B', 10, 4),
('Which organ of the UN elects the judges to the International Court of Justice?', '[{"letter":"A","text":"UN Security Council alone"},{"letter":"B","text":"UN General Assembly alone"},{"letter":"C","text":"UN General Assembly and Security Council concurrently"},{"letter":"D","text":"Secretary-General"}]', 'C', 10, 5),
('The Geneva Conventions primarily concern:', '[{"letter":"A","text":"Diplomatic immunity"},{"letter":"B","text":"Protection of victims of war"},{"letter":"C","text":"Trade regulation"},{"letter":"D","text":"Maritime boundaries"}]', 'B', 10, 6),
('Which nation formally withdrew from the UN Human Rights Council in 2018?', '[{"letter":"A","text":"Russia"},{"letter":"B","text":"China"},{"letter":"C","text":"United States"},{"letter":"D","text":"Israel"}]', 'C', 10, 7),
('The concept of "Soft Power" in international relations was coined by:', '[{"letter":"A","text":"Henry Kissinger"},{"letter":"B","text":"Joseph Nye"},{"letter":"C","text":"Hans Morgenthau"},{"letter":"D","text":"John Mearsheimer"}]', 'B', 10, 8),
('Which crisis triggered the creation of the UN Refugee Agency (UNHCR) in 1950?', '[{"letter":"A","text":"Korean War"},{"letter":"B","text":"World War II displacement"},{"letter":"C","text":"Vietnam War"},{"letter":"D","text":"Partition of India"}]', 'B', 10, 9),
('Under Chapter VII of the UN Charter, the Security Council may take:', '[{"letter":"A","text":"Only non-binding recommendations"},{"letter":"B","text":"Action with respect to threats to peace, including sanctions and force"},{"letter":"C","text":"Judicial rulings on territorial disputes"},{"letter":"D","text":"Budgetary allocations for peacekeeping"}]', 'B', 10, 10);
