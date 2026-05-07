import { Schema } from 'effect';

import type { SiteContent } from './schema';

export const PublishStateInFlight = Schema.Struct({
  hash: Schema.NonEmptyString,
  startedAt: Schema.Number,
});
export type PublishStateInFlight = typeof PublishStateInFlight.Type;

export const PublishState = Schema.Struct({
  contentHash: Schema.NullOr(Schema.NonEmptyString),
  lastDeploymentId: Schema.NullOr(Schema.NonEmptyString),
  lastPublishedAt: Schema.NullOr(Schema.Number),
  inFlight: Schema.NullOr(PublishStateInFlight),
});
export type PublishState = typeof PublishState.Type;

export const PUBLISH_STATE_KEY = 'content/publish-state.json';

/**
 * Window during which an in-flight publish blocks new ones. After this, any
 * stale `inFlight` is treated as a crashed publish and overwritten — the next
 * editor save converges. 90s comfortably covers a Railway redeploy round-trip
 * plus our own bucket writes.
 */
export const IN_FLIGHT_TIMEOUT_MS = 90_000;

/**
 * Deterministic JSON for hashing. Keys are sorted at every depth so two
 * structurally-equal payloads always serialize identically.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = canonicalize((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export function hashContent(content: SiteContent): string {
  const canonical = JSON.stringify(canonicalize(content));
  // Bun.hash returns a number; toString(16) gives a stable hex digest.
  // SHA-256 would be stronger but Bun.hash collision risk is fine for change
  // detection (we're not authenticating, just deduplicating).
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(canonical);
  return hasher.digest('hex');
}
