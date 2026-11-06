# Architecture rules
- Resolve onboarding access through one pure policy and an authenticated server function; the protected layout applies the same result to every initial-access route to avoid contradictory redirects.
- Keep OAuth callbacks public and wait for Auth to process the return before entering the protected layout.
- Approved non-delegate participants use an access-status screen until role-specific portals are implemented; never substitute a delegate portal.
- Registration catalogs use shared strict validation and authenticated admin server functions with RLS; bulk inserts are atomic and never upsert existing records, keeping official configuration separate from participants and House assignments.
- Parse CSV/XLSX in the browser after file selection; import explicit catalog fields only and reject formulas, missing required values and duplicates before submission.
- Preserve legacy onboarding fields; expose stable IDs, approval status and House FK as generated read-only projections to avoid divergent identities or assignments.
- Keep the leaderboard feed aggregated by House/day without participant identity; enforce score locking in RPCs and restrictive RLS, not just presentation.