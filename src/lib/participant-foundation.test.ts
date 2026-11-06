import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Schema contracts complement live read-only database checks; no production test rows.
const roles = readFileSync('drizzle/migrations/0006_extend_access_role_enum.sql', 'utf8');
const schema = readFileSync('drizzle/migrations/0007_participant_identity_privacy.sql', 'utf8');
const reference = readFileSync('drizzle/migrations/0008_house_reference_compatibility.sql', 'utf8');
describe('participant foundation schema contracts', () => {
  it('supports validator and participant independently of participation groups', () => {
    expect(roles).toContain("ADD VALUE IF NOT EXISTS 'validator'");
    expect(roles).toContain("ADD VALUE IF NOT EXISTS 'participant'");
    expect(schema).toContain("participant_group IN ('delegado','mesa','advisor','profesor','staff','departamento')");
  });
  it('keeps the external participant identifier immutable and unique', () => {
    expect(schema).toContain('participant_id_stable uuid GENERATED ALWAYS AS (user_id) STORED');
    expect(schema).toContain('CREATE UNIQUE INDEX participants_stable_identity_unique');
  });
  it('maps active to approved without replacing legacy status', () => {
    expect(schema).toContain("CASE status WHEN 'active' THEN 'approved' ELSE status END");
  });
  it('does not assign a default House', () => {
    expect(reference).toContain('house_id public.house GENERATED ALWAYS AS (house) STORED');
    expect(reference).not.toMatch(/DEFAULT\s+'atlas'/i);
    expect(reference).toContain('FOREIGN KEY (house_id) REFERENCES public.houses(id)');
  });
  it('denies self-granted roles', () => {
    expect(schema).toContain('WITH CHECK (user_id <> auth.uid()');
    expect(schema).toContain('REVOKE UPDATE ON public.user_roles FROM authenticated');
  });
  it('locks RPC and direct score reads', () => {
    expect(schema).toContain('"Scores hidden while locked" ON public.score_events AS RESTRICTIVE');
    expect(schema.match(/public\.is_admin\(auth\.uid\(\)\) OR NOT public\.scores_are_locked\(\)/g)?.length).toBe(3);
  });
  it('does not return delegate identity in the feed', () => {
    const feed = schema.split('CREATE OR REPLACE FUNCTION public.leaderboard_feed')[1]?.split('REVOKE ALL')[0];
    expect(feed).toBeDefined();
    expect(feed).not.toContain('full_name');
    expect(feed).not.toContain('user_id');
    expect(feed).toContain("'House'::text");
  });
});