import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      key: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL', '/auth/apple/callback'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, idToken: string, refreshToken: string, profile: any, verified: VerifyCallback): Promise<any> {
    const { id, name, email } = profile;

    const user = {
      provider: 'apple',
      providerId: id,
      displayName: name?.firstName ? `${name.firstName} ${name.lastName || ''}`.trim() : 'Apple User',
      email,
      accessToken: idToken,
      refreshToken,
    };

    verified(null, user);
  }
}
