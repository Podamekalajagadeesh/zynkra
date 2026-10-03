import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    service = new LocationService();
  });

  describe('storage', () => {
    it('stores and reads a location', () => {
      service.setLocation('u1', 51.5, -0.12);
      expect(service.getLocation('u1')).toMatchObject({
        userId: 'u1',
        latitude: 51.5,
        longitude: -0.12,
      });
    });

    it('returns undefined for an unknown user', () => {
      expect(service.getLocation('nobody')).toBeUndefined();
    });

    it('clears a location on disconnect', () => {
      service.setLocation('u1', 1, 2);
      service.clearLocation('u1');
      expect(service.getLocation('u1')).toBeUndefined();
    });
  });

  describe('privacy defaults', () => {
    it('shares with everyone when no privacy setting exists', () => {
      service.setLocation('u1', 1, 2);
      expect(service.canViewLocation('u1', 'anyone')).toBe(true);
    });
  });

  describe('privacy rules', () => {
    const base = {
      shareWith: 'all_friends' as const,
      selectedFriendIds: [] as string[],
      ghostMode: false,
      expireAfter: '24hours',
    };

    it('hides everyone in ghost mode', () => {
      service.setPrivacy('u1', { ...base, ghostMode: true });
      expect(service.canViewLocation('u1', 'f1')).toBe(false);
    });

    it("hides everyone when shareWith is 'no_one'", () => {
      service.setPrivacy('u1', { ...base, shareWith: 'no_one' });
      expect(service.canViewLocation('u1', 'f1')).toBe(false);
    });

    it('restricts to selected friends', () => {
      service.setPrivacy('u1', { ...base, shareWith: 'selected_friends', selectedFriendIds: ['f1'] });
      expect(service.canViewLocation('u1', 'f1')).toBe(true);
      expect(service.canViewLocation('u1', 'f2')).toBe(false);
    });

    it('hides the location once the expiry has passed', () => {
      service.setPrivacy('u1', { ...base, expireAfter: '1hour' });
      const stored = service.getPrivacy('u1')!;
      // Force expiry into the past.
      stored.expiresAt = new Date(Date.now() - 1000);
      expect(service.canViewLocation('u1', 'f1')).toBe(false);
    });

    it('defaults selectedFriendIds to an empty list when omitted', () => {
      service.setPrivacy('u1', { ...base, shareWith: 'selected_friends' });
      expect(service.getPrivacy('u1')?.selectedFriendIds).toEqual([]);
    });
  });

  describe('calculateExpiration', () => {
    it('maps 1hour to ~1h', () => {
      const delta = service.calculateExpiration('1hour').getTime() - Date.now();
      expect(delta).toBeGreaterThan(3_500_000);
      expect(delta).toBeLessThanOrEqual(3_600_000);
    });

    it('maps 24hours to ~24h', () => {
      const delta = service.calculateExpiration('24hours').getTime() - Date.now();
      expect(delta).toBeGreaterThan(86_000_000);
    });

    it('falls back to ~1 year for unknown values', () => {
      const delta = service.calculateExpiration('nonsense').getTime() - Date.now();
      expect(delta).toBeGreaterThan(364 * 24 * 60 * 60 * 1000);
    });
  });
});
