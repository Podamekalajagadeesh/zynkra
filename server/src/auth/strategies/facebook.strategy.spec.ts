import { ConfigService } from '@nestjs/config';

jest.mock('passport-facebook', () => ({
  Strategy: jest.fn(),
}));

import { FacebookStrategy } from './facebook.strategy';

describe('FacebookStrategy', () => {
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          FACEBOOK_CLIENT_ID: 'test-client-id',
          FACEBOOK_CLIENT_SECRET: 'test-client-secret',
          FACEBOOK_CALLBACK_URL: 'http://localhost:3000/auth/facebook/callback',
        };
        return config[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;
  });

  it('initializes without errors when credentials are provided', () => {
    const strategy = new FacebookStrategy(configService);
    expect(strategy).toBeDefined();
  });

  it('initializes with fallback placeholders when credentials are missing', () => {
    const emptyConfig = {
      get: jest.fn(() => undefined),
    } as unknown as jest.Mocked<ConfigService>;

    expect(() => new FacebookStrategy(emptyConfig)).not.toThrow();
  });
});
