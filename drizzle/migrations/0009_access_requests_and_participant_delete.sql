-- Solicitudes de acceso (Mesa / Delegación / Profesor / Staff) y eliminación de participantes.
-- Aplicar en Supabase → SQL Editor (o `supabase db push` con la CLI).

-- Cualquier participante recién registrado deja su ficha en revisión hasta que
-- un administrador la apruebe desde el panel → Solicitudes.
CREATE OR REPLACE FUNCTION public.request_participant_review()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.participants%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO _p FROM public.participants WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ficha de participante no encontrada'; END IF;
  IF _p.status = 'pending' THEN RETURN; END IF;

  UPDATE public.participants
     SET status = 'pending', updated_at = now()
   WHERE user_id = _uid;

  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, before, after)
  VALUES (_uid, 'REQUEST_REVIEW', 'participants', _uid::text, to_jsonb(_p), jsonb_build_object('status', 'pending'));
END $$;

REVOKE ALL ON FUNCTION public.request_participant_review() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_participant_review() TO authenticated;

-- Borrado completo de un participante (perfil, roles, puntos e historial).
-- Sustituye al borrado parcial que sólo elimina el perfil.
CREATE OR REPLACE FUNCTION public.admin_delete_participant(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _p public.participants%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes eliminar tu propia cuenta'; END IF;

  SELECT * INTO _p FROM public.participants WHERE user_id = _user_id;

  DELETE FROM public.trivia_answers  WHERE user_id = _user_id;
  DELETE FROM public.trivia_sessions WHERE user_id = _user_id;
  DELETE FROM public.mission_submissions WHERE user_id = _user_id;
  DELETE FROM public.checkin_events   WHERE user_id = _user_id;
  DELETE FROM public.score_events     WHERE user_id = _user_id;
  DELETE FROM public.house_assignments WHERE user_id = _user_id;
  DELETE FROM public.participants     WHERE user_id = _user_id;
  DELETE FROM public.user_roles       WHERE user_id = _user_id;
  DELETE FROM public.profiles         WHERE id = _user_id;

  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, before, reason)
  VALUES (auth.uid(), 'DELETE_PARTICIPANT', 'participants', _user_id::text, to_jsonb(_p), 'Eliminado desde el panel de administración');
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_participant(uuid) TO authenticated;
