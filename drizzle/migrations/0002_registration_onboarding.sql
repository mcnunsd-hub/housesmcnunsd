CREATE TABLE public.committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.committees TO authenticated;
GRANT ALL ON public.committees TO service_role;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Committees readable" ON public.committees FOR SELECT TO authenticated USING (active OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage committees" ON public.committees FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  country text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (committee_id, country)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delegations TO authenticated;
GRANT ALL ON public.delegations TO service_role;
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Delegations readable" ON public.delegations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage delegations" ON public.delegations FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.mesa_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  position text NOT NULL,
  claimed_by uuid UNIQUE,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesa_roster TO authenticated;
GRANT ALL ON public.mesa_roster TO service_role;
ALTER TABLE public.mesa_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roster readable" ON public.mesa_roster FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roster" ON public.mesa_roster FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  participant_type text NOT NULL CHECK (participant_type IN ('staff','profesor')),
  active boolean NOT NULL DEFAULT true,
  uses int NOT NULL DEFAULT 0,
  max_uses int,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage codes" ON public.invite_codes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.participants (
  user_id uuid PRIMARY KEY,
  participant_type text NOT NULL CHECK (participant_type IN ('delegado','mesa','profesor','staff')),
  full_name text NOT NULL,
  school text,
  grade_level text,
  experience text CHECK (experience IN ('Principiante','Intermedio','Avanzado')),
  committee_id uuid REFERENCES public.committees(id),
  country text,
  mesa_roster_id uuid REFERENCES public.mesa_roster(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read participant" ON public.participants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Atomic registration
CREATE OR REPLACE FUNCTION public.register_participant(
  _type text, _full_name text, _school text, _grade_level text, _experience text,
  _committee_id uuid, _country text, _roster_id uuid, _code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _status text := 'active';
  _r public.mesa_roster%ROWTYPE;
  _c public.invite_codes%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.participants WHERE user_id = _uid) THEN RAISE EXCEPTION 'Ya completaste tu registro'; END IF;
  IF coalesce(trim(_full_name),'') = '' THEN RAISE EXCEPTION 'Nombre requerido'; END IF;

  IF _type = 'delegado' THEN
    IF _committee_id IS NULL OR coalesce(trim(_country),'') = '' OR _experience IS NULL THEN
      RAISE EXCEPTION 'Completa comité, delegación y experiencia';
    END IF;
    INSERT INTO public.participants(user_id, participant_type, full_name, school, grade_level, experience, committee_id, country)
    VALUES (_uid, 'delegado', _full_name, _school, _grade_level, _experience, _committee_id, _country);
    UPDATE public.profiles SET full_name = _full_name,
      committee = (SELECT name FROM public.committees WHERE id = _committee_id),
      country = _country,
      seniority_tier = CASE WHEN _experience = 'Avanzado' THEN 'advanced'::seniority_tier ELSE 'first_timer'::seniority_tier END,
      updated_at = now()
    WHERE id = _uid;

  ELSIF _type = 'mesa' THEN
    SELECT * INTO _r FROM public.mesa_roster WHERE id = _roster_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Puesto de Mesa no encontrado'; END IF;
    IF _r.claimed_by IS NOT NULL THEN RAISE EXCEPTION 'Este puesto ya fue reclamado'; END IF;
    UPDATE public.mesa_roster SET claimed_by = _uid, claimed_at = now() WHERE id = _roster_id;
    INSERT INTO public.participants(user_id, participant_type, full_name, school, committee_id, mesa_roster_id)
    VALUES (_uid, 'mesa', _r.full_name, _school, _r.committee_id, _r.id);
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'mesa') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET full_name = _r.full_name, updated_at = now() WHERE id = _uid;

  ELSIF _type IN ('staff','profesor') THEN
    SELECT * INTO _c FROM public.invite_codes WHERE upper(code) = upper(trim(_code)) AND participant_type = _type AND active FOR UPDATE;
    IF NOT FOUND OR (_c.max_uses IS NOT NULL AND _c.uses >= _c.max_uses) THEN RAISE EXCEPTION 'Código inválido o vencido'; END IF;
    UPDATE public.invite_codes SET uses = uses + 1 WHERE id = _c.id;
    _status := 'pending';
    INSERT INTO public.participants(user_id, participant_type, full_name, school, status)
    VALUES (_uid, _type, _full_name, _school, 'pending');
    UPDATE public.profiles SET full_name = _full_name, updated_at = now() WHERE id = _uid;
  ELSE
    RAISE EXCEPTION 'Tipo de participante inválido';
  END IF;

  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, after)
  VALUES (_uid, 'REGISTER', 'participants', _uid::text, jsonb_build_object('type', _type, 'status', _status));
  RETURN _status;
END $$;
REVOKE ALL ON FUNCTION public.register_participant(text,text,text,text,text,uuid,text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,text,uuid,text,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_participant(_user_id uuid, _approve boolean, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.participants%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _p FROM public.participants WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND OR _p.status <> 'pending' THEN RAISE EXCEPTION 'Solicitud no pendiente'; END IF;
  UPDATE public.participants SET status = CASE WHEN _approve THEN 'active' ELSE 'rejected' END, updated_at = now() WHERE user_id = _user_id;
  IF _approve THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _p.participant_type::app_role) ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, before, after, reason)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'APPROVE' ELSE 'REJECT' END, 'participants', _user_id::text, to_jsonb(_p), NULL, _reason);
END $$;
REVOKE ALL ON FUNCTION public.review_participant(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_participant(uuid,boolean,text) TO authenticated;

-- Existing users who already went through sorting count as registered delegates
INSERT INTO public.participants(user_id, participant_type, full_name, experience, country)
SELECT p.id, 'delegado', COALESCE(p.full_name,'—'),
  CASE WHEN p.seniority_tier = 'advanced' THEN 'Avanzado' ELSE 'Principiante' END, p.country
FROM public.profiles p WHERE p.house IS NOT NULL
ON CONFLICT DO NOTHING;