/**
 * Peer identity rotation decisions — pure logic.
 *
 * These rules are the difference between "keep ratcheting" and "re-run X3DH"
 * when a peer's identity key changes underneath an established session.
 */
import { describe, it, expect } from 'vitest';
import { decidePeerRotation, PEER_IDENTITY_CHECK_TTL_MS } from './e2ee-rotation';

const NOW = 1_700_000_000_000;
const TTL = PEER_IDENTITY_CHECK_TTL_MS;

describe('decidePeerRotation', () => {
  it('throttles when checked within the TTL', () => {
    expect(decidePeerRotation('A', 'B', NOW - TTL + 1, NOW, TTL)).toBe('throttled');
  });

  it('does not throttle when the last check was before the TTL', () => {
    expect(decidePeerRotation('A', 'B', NOW - TTL, NOW, TTL)).not.toBe('throttled');
  });

  it('never throttles a peer never checked before', () => {
    expect(decidePeerRotation('A', 'B', 0, NOW, TTL)).not.toBe('throttled');
  });

  it('keeps the session when the server has no identity (offline/purged)', () => {
    expect(decidePeerRotation('A', null, 0, NOW, TTL)).toBe('remote-unavailable');
  });

  it('adopts the remote identity when none is cached (first check)', () => {
    expect(decidePeerRotation(null, 'B', 0, NOW, TTL)).toBe('adopt');
  });

  it('reports unchanged when cached and remote identities match', () => {
    expect(decidePeerRotation('KEY1', 'KEY1', 0, NOW, TTL)).toBe('unchanged');
  });

  it('requests re-establishment when the peer rotated their identity', () => {
    expect(decidePeerRotation('KEY1', 'KEY2', 0, NOW, TTL)).toBe('reestablish');
  });

  it('honors a custom TTL', () => {
    expect(decidePeerRotation('A', 'B', NOW - 1000, NOW, 500)).not.toBe('throttled');
    expect(decidePeerRotation('A', 'B', NOW - 1000, NOW, 2000)).toBe('throttled');
  });
});
