import { Test, TestingModule } from '@nestjs/testing';
import { PreKeysController } from './prekeys.controller';
import { PreKeysService } from './prekeys.service';

describe('PreKeysController', () => {
  let controller: PreKeysController;
  let service: {
    uploadIdentityKey: jest.Mock;
    uploadSignedPreKey: jest.Mock;
    uploadOneTimePreKeys: jest.Mock;
    uploadPreKeyBundle: jest.Mock;
    getPreKeyBundle: jest.Mock;
    getOneTimePreKeyCount: jest.Mock;
    getRotationEvents: jest.Mock;
    getIdentityKeyStatus: jest.Mock;
  };

  const req = { user: { userId: 'u1' } };

  beforeEach(async () => {
    service = {
      uploadIdentityKey: jest.fn(),
      uploadSignedPreKey: jest.fn(),
      uploadOneTimePreKeys: jest.fn(),
      uploadPreKeyBundle: jest.fn(),
      getPreKeyBundle: jest.fn(),
      getOneTimePreKeyCount: jest.fn(),
      getRotationEvents: jest.fn(),
      getIdentityKeyStatus: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreKeysController],
      providers: [{ provide: PreKeysService, useValue: service }],
    }).compile();

    controller = module.get<PreKeysController>(PreKeysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST keys/identity', () => {
    it('uploads the identity under the authenticated user', async () => {
      await controller.uploadIdentityKey(req, 'identity-b64');
      expect(service.uploadIdentityKey).toHaveBeenCalledWith('u1', 'identity-b64');
    });
  });

  describe('POST keys/signed-prekey', () => {
    it('forwards keyId, publicKey, and signature for the caller', async () => {
      await controller.uploadSignedPreKey(req, 1, 'spk-b64', 'sig-b64');
      expect(service.uploadSignedPreKey).toHaveBeenCalledWith('u1', 1, 'spk-b64', 'sig-b64');
    });
  });

  describe('POST keys/one-time-prekeys', () => {
    it('wraps the resulting stored count', async () => {
      const preKeys = [
        { keyId: 2, publicKey: 'pk2' },
        { keyId: 3, publicKey: 'pk3' },
      ];
      service.uploadOneTimePreKeys.mockResolvedValue(2);

      await expect(controller.uploadOneTimePreKeys(req, preKeys)).resolves.toEqual({
        count: 2,
      });
      expect(service.uploadOneTimePreKeys).toHaveBeenCalledWith('u1', preKeys);
    });
  });

  describe('POST keys/bundle', () => {
    it('forwards the full bundle for the caller', async () => {
      const bundle = {
        registrationId: 4242,
        identityKey: 'ik',
        signedPreKey: { keyId: 1, publicKey: 'spk', signature: 'sig' },
        oneTimePreKeys: [{ keyId: 2, publicKey: 'pk2' }],
      };
      await controller.uploadPreKeyBundle(req, bundle);
      expect(service.uploadPreKeyBundle).toHaveBeenCalledWith('u1', bundle);
    });
  });

  describe('GET keys/bundle/:userId', () => {
    it('returns the recipient bundle (one-time pre-key may be null)', async () => {
      const bundle = {
        registrationId: 1,
        identityKey: 'ik',
        signedPreKey: { keyId: 1, publicKey: 'spk', signature: 'sig' },
        oneTimePreKey: null,
      };
      service.getPreKeyBundle.mockResolvedValue(bundle);

      await expect(controller.getPreKeyBundle('bob')).resolves.toEqual(bundle);
      expect(service.getPreKeyBundle).toHaveBeenCalledWith('bob');
    });
  });

  describe('GET keys/prekey-count', () => {
    it('scopes the count to the authenticated user', async () => {
      service.getOneTimePreKeyCount.mockResolvedValue(17);
      await expect(controller.getOneTimePreKeyCount(req)).resolves.toEqual({ count: 17 });
      expect(service.getOneTimePreKeyCount).toHaveBeenCalledWith('u1');
    });
  });

  describe('GET keys/rotation-events', () => {
    it('passes an undefined cursor when since is absent', async () => {
      service.getRotationEvents.mockResolvedValue([]);
      await controller.getRotationEvents(req, undefined);
      expect(service.getRotationEvents).toHaveBeenCalledWith('u1', undefined);
    });

    it('parses a valid since instant into a Date', async () => {
      service.getRotationEvents.mockResolvedValue([]);
      const since = '2026-01-02T03:04:05.000Z';
      await controller.getRotationEvents(req, since);
      expect(service.getRotationEvents).toHaveBeenCalledWith('u1', new Date(since));
    });

    it('drops a malformed since instead of passing Invalid Date', async () => {
      service.getRotationEvents.mockResolvedValue([]);
      await controller.getRotationEvents(req, 'not-a-date');
      expect(service.getRotationEvents).toHaveBeenCalledWith('u1', undefined);
    });
  });

  describe('GET keys/identity/:userId', () => {
    it('returns the peer identity and rotation timestamp', async () => {
      service.getIdentityKeyStatus.mockResolvedValue({
        publicKey: 'peer-ik',
        rotatedAt: '2026-01-02T03:04:05.000Z',
      });
      await expect(controller.getIdentityKeyStatus('bob')).resolves.toEqual({
        publicKey: 'peer-ik',
        rotatedAt: '2026-01-02T03:04:05.000Z',
      });
      expect(service.getIdentityKeyStatus).toHaveBeenCalledWith('bob');
    });
  });
});
