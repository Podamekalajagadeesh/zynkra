/**
 * Peer identity rotation decision (pure logic — no network, no storage).
 *
 * Signal sessions ratchet toward the identity key captured when the session
 * was established. If the peer later rotates their identity key (new install,
 * key compromise response), continuing to ratchet produces ciphertext they can
 * no longer decrypt. The fix is to tear the session down and re-run X3DH
 * against the current pre-key bundle.
 *
 * This module decides *whether* to do that, given:
 *  - the identity we cached for the peer when the session was built
 *    (persisted by the Signal store's `saveIdentity`),
 *  - the identity the server reports right now (`GET /keys/identity/:userId`).
 *
 * Checks are throttled per peer: identity rotation is rare, and one extra GET
 * per conversation per TTL is the cost of catching it.
 */

/** Minimum gap between server-side identity checks for one peer. */
export const PEER_IDENTITY_CHECK_TTL_MS = 5 * 60_000;

export type RotationDecision =
  /** Within TTL — don't hit the network again yet. */
  | 'throttled'
  /** Server has no identity for the peer right now (unreachable or purged) — keep the session. */
  | 'remote-unavailable'
  /** No cached identity to compare — record nothing, keep the session. */
  | 'adopt'
  /** Keys match — session is still aimed at the peer's current identity. */
  | 'unchanged'
  /** Cached identity differs from server's — rebuild the session via X3DH. */
  | 'reestablish';

/**
 * Decide whether an existing session should be rebuilt because the peer's
 * identity key changed.
 *
 * @param cachedKey  base64 identity key stored when the session was established, or null
 * @param remoteKey  base64 identity key the server reports now, or null
 * @param lastCheckedAt  epoch ms of the last server check for this peer (0 = never)
 * @param now  current epoch ms
 */
export function decidePeerRotation(
  cachedKey: string | null,
  remoteKey: string | null,
  lastCheckedAt: number,
  now: number,
  ttlMs: number = PEER_IDENTITY_CHECK_TTL_MS
): RotationDecision {
  if (lastCheckedAt > 0 && now - lastCheckedAt < ttlMs) {
    return 'throttled';
  }
  if (!remoteKey) {
    return 'remote-unavailable';
  }
  if (!cachedKey) {
    return 'adopt';
  }
  return cachedKey === remoteKey ? 'unchanged' : 'reestablish';
}
