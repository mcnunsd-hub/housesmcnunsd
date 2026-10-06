CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','super_admin'))
$$;
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'super_admin')
$$;
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('staff','admin','super_admin'))
$$;

-- has_role: admin implied by super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND (role = _role OR (_role::text = 'admin' AND role::text = 'super_admin')))
$$;

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_table text,
  target_id text,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log(actor_id, action, target_table, target_id, before, after)
  VALUES (auth.uid(), TG_OP, 'user_roles', COALESCE(NEW.user_id, OLD.user_id)::text,
    CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP='INSERT' THEN to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles();

-- user_roles: admins grant non-admin roles; only super_admin grants admin/super_admin
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins grant roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    (role::text IN ('delegate','mesa','profesor','staff') AND public.is_admin(auth.uid()))
    OR (role::text IN ('admin','super_admin') AND public.is_super_admin(auth.uid()))
  );
CREATE POLICY "Admins revoke roles" ON public.user_roles FOR DELETE TO authenticated
  USING (
    user_id <> auth.uid() AND (
      (role::text IN ('delegate','mesa','profesor','staff') AND public.is_admin(auth.uid()))
      OR (role::text IN ('admin','super_admin') AND public.is_super_admin(auth.uid()))
    )
  );

-- profiles: private by default
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff_or_admin(auth.uid()));

-- Aggregate population for balanced assignment (no personal data)
CREATE OR REPLACE FUNCTION public.house_population()
RETURNS TABLE(house public.house, seniority_tier public.seniority_tier, n bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.house, p.seniority_tier, count(*) FROM public.profiles p
  WHERE p.house IS NOT NULL GROUP BY p.house, p.seniority_tier
$$;
REVOKE ALL ON FUNCTION public.house_population() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.house_population() TO authenticated;

CREATE OR REPLACE FUNCTION public.my_roles()
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.my_roles() TO authenticated;

-- Default delegate role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'delegate') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

INSERT INTO public.user_roles (user_id, role) SELECT id, 'delegate' FROM public.profiles ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name) SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;