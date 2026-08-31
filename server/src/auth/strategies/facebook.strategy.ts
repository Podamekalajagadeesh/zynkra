import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('FACEBOOK_CLIENT_ID');
    if (!clientID) {
      new Logger(FacebookStrategy.name).warn(
        'FACEBOOK_CLIENT_ID not set — Facebook sign-in is disabled.',
      );
    }

    super({
      clientID: clientID || 'facebook-oauth-not-configured',
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET') || 'facebook-oauth-not-configured',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL', '/auth/facebook/callback'),
      scope: ['email', 'public_profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    const user = {
      provider: 'facebook',
      providerId: id,
      displayName,
      email: emails?.[0]?.value,
      profilePictureUrl: photos?.[0]?.value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
