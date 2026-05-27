
DROP VIEW IF EXISTS public.house_scores;

CREATE OR REPLACE VIEW public.house_scores WITH (security_invoker = true) AS
SELECT 
  house,
  COALESCE(SUM(points), 0) AS total_points,
  COUNT(DISTINCT user_id) AS delegate_count
FROM public.score_events
GROUP BY house;

GRANT SELECT ON public.house_scores TO authenticated;
GRANT ALL ON public.house_scores TO service_role;
