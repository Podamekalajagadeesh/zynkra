import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL', '/auth/facebook/callback'),
      scope: ['email', 'public_profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
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
