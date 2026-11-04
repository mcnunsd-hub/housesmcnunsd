# Architecture rules
- Resolve onboarding access through one pure policy and an authenticated server function; the protected layout applies the same result to every initial-access route to avoid contradictory redirects.
- Keep OAuth callbacks public and wait for Auth to process the return before entering the protected layout.
- Approved non-delegate participants use an access-status screen until role-specific portals are implemented; never substitute a delegate portal.