
-- =========================================================
-- Phase 4: QR Check-in, Misiones Secretas, Roles de Staff
-- =========================================================

-- Roles de aplicación
CREATE TYPE public.app_role AS ENUM ('delegate', 'staff', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Función security-definer para chequear rol
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================================
-- Tokens de Check-in (QR rotativo por delegado)
-- =========================================================
CREATE TABLE public.checkin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkin_tokens TO authenticated;
GRANT ALL ON public.checkin_tokens TO service_role;

ALTER TABLE public.checkin_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own tokens"
  ON public.checkin_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read tokens"
  ON public.checkin_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Eventos de Check-in (escaneos validados)
-- =========================================================
CREATE TABLE public.checkin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scanned_by uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'session',
  location text,
  points integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.checkin_events TO authenticated;
GRANT ALL ON public.checkin_events TO service_role;

ALTER TABLE public.checkin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Check-ins readable"
  ON public.checkin_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert check-ins"
  ON public.checkin_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Misiones Secretas
-- =========================================================
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 25,
  active boolean NOT NULL DEFAULT true,
  requires_proof boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Missions readable"
  ON public.missions FOR SELECT TO authenticated USING (active = true);

-- Submissions de misión
CREATE TABLE public.mission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  proof_text text,
  proof_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);

GRANT SELECT, INSERT ON public.mission_submissions TO authenticated;
GRANT UPDATE ON public.mission_submissions TO authenticated;
GRANT ALL ON public.mission_submissions TO service_role;

ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own submissions"
  ON public.mission_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own submissions"
  ON public.mission_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff review submissions"
  ON public.mission_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Seed de misiones
-- =========================================================
INSERT INTO public.missions (title, description, points) VALUES
  ('Diplomacia Cruzada', 'Forma una alianza escrita con un delegado de otra Casa y sube una foto del acuerdo firmado.', 30),
  ('Oratoria Espontánea', 'Pronuncia un discurso de 60 segundos sobre un tema asignado por el staff y graba un video.', 25),
  ('Resolución Relámpago', 'Redacta un párrafo operativo aprobado por el chair de tu comité y sube su firma.', 40),
  ('Networking Estratégico', 'Intercambia tarjetas con 3 delegados de las otras 3 Casas.', 20),
  ('Memoria Histórica', 'Cita correctamente un mentor histórico de tu Casa en intervención formal y consigue confirmación del staff.', 25);

-- =========================================================
-- Storage bucket para evidencia de misiones
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('mission-proofs', 'mission-proofs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mission-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mission-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')));
