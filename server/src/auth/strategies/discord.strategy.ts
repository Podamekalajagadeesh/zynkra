import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('DISCORD_CLIENT_ID') || 'discord-oauth-not-configured',
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET') || 'discord-oauth-not-configured',
      callbackURL: configService.get<string>('DISCORD_CALLBACK_URL', '/auth/discord/callback'),
      scope: ['identify', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, username, email, avatar } = profile;

    const user = {
      provider: 'discord',
      providerId: id,
      displayName: username,
      email,
      profilePictureUrl: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
