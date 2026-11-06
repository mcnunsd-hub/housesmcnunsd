ALTER TABLE public.profiles ADD COLUMN house_id public.house GENERATED ALWAYS AS (house) STORED;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_house_reference FOREIGN KEY (house_id) REFERENCES public.houses(id) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_house_reference;
COMMENT ON COLUMN public.profiles.house_id IS 'Read-only FK projection of the existing ceremony assignment; nullable with no default House.';
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (id,full_name,committee,country,seniority_tier,updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (full_name,committee,country,seniority_tier,updated_at) ON public.profiles TO authenticated;