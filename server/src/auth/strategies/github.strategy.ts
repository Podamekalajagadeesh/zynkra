import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', '/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      provider: 'github',
      providerId: id,
      displayName: displayName || username,
      email: emails?.[0]?.value,
      profilePictureUrl: photos?.[0]?.value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
