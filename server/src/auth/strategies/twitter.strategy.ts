import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(private configService: ConfigService) {
    super({
      consumerKey: configService.get<string>('TWITTER_CONSUMER_KEY') || 'twitter-oauth-not-configured',
      consumerSecret: configService.get<string>('TWITTER_CONSUMER_SECRET') || 'twitter-oauth-not-configured',
      callbackURL: configService.get<string>('TWITTER_CALLBACK_URL', '/auth/twitter/callback'),
      includeEmail: true,
    });
  }

  async validate(token: string, tokenSecret: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      provider: 'twitter',
      providerId: id,
      displayName: displayName || username,
      email: emails?.[0]?.value,
      profilePictureUrl: photos?.[0]?.value,
      accessToken: token,
      refreshToken: tokenSecret,
    };

    done(null, user);
  }
}
