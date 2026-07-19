import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    // passport-oauth2 throws without a clientID. Fall back to placeholders so
    // the server can boot without Google OAuth configured — the /auth/google
    // flow just fails at Google until real credentials are provided.
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    if (!clientID) {
      new Logger(GoogleStrategy.name).warn(
        'GOOGLE_CLIENT_ID not set — Google sign-in is disabled.',
      );
    }
    super({
      clientID: clientID || 'google-oauth-not-configured',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'google-oauth-not-configured',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      providerId: profile.id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}