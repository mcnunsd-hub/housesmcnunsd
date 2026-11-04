CREATE OR REPLACE FUNCTION public.register_participant(_type text, _full_name text, _school text, _grade_level text, _experience text, _committee_id uuid, _country text, _roster_id uuid, _code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 _uid uuid := auth.uid(); _status text := 'active'; _r public.mesa_roster%ROWTYPE; _c public.invite_codes%ROWTYPE;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Debe iniciar sesión para completar el registro.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 0));
 IF EXISTS (SELECT 1 FROM public.participants WHERE user_id = _uid) THEN RAISE EXCEPTION 'Su cuenta ya tiene una ficha de participante.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN RAISE EXCEPTION 'Su perfil requiere revisión por el Secretariado.'; END IF;
 IF _type IS NULL OR _type NOT IN ('delegado','mesa','staff','profesor') THEN RAISE EXCEPTION 'Tipo de participante inválido.'; END IF;
 IF char_length(coalesce(trim(_full_name),'')) NOT BETWEEN 2 AND 120 THEN RAISE EXCEPTION 'Indique un nombre válido de entre 2 y 120 caracteres.'; END IF;
 IF char_length(coalesce(trim(_school),'')) NOT BETWEEN 2 AND 120 THEN RAISE EXCEPTION 'Indique un colegio válido de entre 2 y 120 caracteres.'; END IF;
 IF char_length(coalesce(_grade_level,'')) > 40 THEN RAISE EXCEPTION 'El curso no puede superar 40 caracteres.'; END IF;
 IF _type = 'delegado' THEN
  IF _experience IS NULL OR _experience NOT IN ('Principiante','Intermedio','Avanzado') THEN RAISE EXCEPTION 'Seleccione un nivel de experiencia válido.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.committees WHERE id = _committee_id AND active) THEN RAISE EXCEPTION 'Seleccione un comité activo.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delegations WHERE committee_id = _committee_id AND country = _country) THEN RAISE EXCEPTION 'Seleccione una delegación válida para su comité.'; END IF;
  INSERT INTO public.participants(user_id,participant_type,full_name,school,grade_level,experience,committee_id,country)
  VALUES (_uid,'delegado',trim(_full_name),trim(_school),_grade_level,_experience,_committee_id,_country);
  UPDATE public.profiles SET full_name=trim(_full_name), committee=(SELECT name FROM public.committees WHERE id=_committee_id), country=_country,
   seniority_tier=CASE WHEN _experience='Avanzado' THEN 'advanced'::seniority_tier ELSE 'first_timer'::seniority_tier END, updated_at=now() WHERE id=_uid;
 ELSIF _type = 'mesa' THEN
  SELECT * INTO _r FROM public.mesa_roster WHERE id=_roster_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Puesto de Mesa no encontrado.'; END IF;
  IF _r.claimed_by IS NOT NULL THEN RAISE EXCEPTION 'Este puesto ya fue reclamado.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.committees WHERE id=_r.committee_id AND active) THEN RAISE EXCEPTION 'El comité de este puesto no está activo.'; END IF;
  UPDATE public.mesa_roster SET claimed_by=_uid,claimed_at=now() WHERE id=_roster_id;
  INSERT INTO public.participants(user_id,participant_type,full_name,school,committee_id,mesa_roster_id) VALUES (_uid,'mesa',_r.full_name,trim(_school),_r.committee_id,_r.id);
  INSERT INTO public.user_roles(user_id,role) VALUES (_uid,'mesa') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET full_name=_r.full_name,updated_at=now() WHERE id=_uid;
 ELSE
  SELECT * INTO _c FROM public.invite_codes WHERE upper(code)=upper(trim(_code)) AND participant_type=_type AND active FOR UPDATE;
  IF NOT FOUND OR (_c.max_uses IS NOT NULL AND _c.uses>=_c.max_uses) THEN RAISE EXCEPTION 'Código inválido o vencido.'; END IF;
  UPDATE public.invite_codes SET uses=uses+1 WHERE id=_c.id;
  _status:='pending';
  INSERT INTO public.participants(user_id,participant_type,full_name,school,status) VALUES (_uid,_type,trim(_full_name),trim(_school),'pending');
  UPDATE public.profiles SET full_name=trim(_full_name),updated_at=now() WHERE id=_uid;
 END IF;
 INSERT INTO public.audit_log(actor_id,action,target_table,target_id,after) VALUES (_uid,'REGISTER','participants',_uid::text,jsonb_build_object('type',_type,'status',_status));
 RETURN _status;
END $$;
REVOKE ALL ON FUNCTION public.register_participant(text,text,text,text,text,uuid,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,text,uuid,text,uuid,text) TO authenticated;