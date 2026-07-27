import { ConfigService } from '@nestjs/config';

// Must mock before importing the strategy
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn(),
}));

import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
        };
        return config[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;
  });

  describe('constructor', () => {
    it('initializes without errors when credentials are provided', () => {
      const strategy = new GoogleStrategy(configService);
      expect(strategy).toBeDefined();
    });

    it('initializes with fallback placeholders when credentials missing', () => {
      const emptyConfig = {
        get: jest.fn(() => undefined),
      } as unknown as jest.Mocked<ConfigService>;

      const strategy = new GoogleStrategy(emptyConfig);
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('extracts user profile from Google OAuth response', async () => {
      const strategy = new GoogleStrategy(configService);

      const profile = {
        id: 'google-user-123',
        name: { givenName: 'John', familyName: 'Doe' },
        emails: [{ value: 'john@example.com' }],
        photos: [{ value: 'https://lh3.googleusercontent.com/photo.jpg' }],
      };

      const done = jest.fn();
      await strategy.validate('google-access-token', 'google-refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        providerId: 'google-user-123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        accessToken: 'google-access-token',
      });
    });
  });
});
