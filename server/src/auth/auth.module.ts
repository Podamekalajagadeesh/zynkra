import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Authenticator } from './entities/authenticator.entity';
import { EmailModule } from '../email/email.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { TwitterStrategy } from './strategies/twitter.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WebauthnService } from './webauthn.service';
import { BiometricAuthService } from './biometric-auth.service';
import { LoginSession } from './entities/login-session.entity';
import { User } from '../users/entities/user.entity';
import { CaptchaService } from './captcha.service';
import { InviteCodesModule } from '../invite-codes/invite-codes.module';
import { BrainwaveDevice } from './entities/brainwave-device.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    EmailModule,
    forwardRef(() => NotificationsModule),
    InviteCodesModule,
    TypeOrmModule.forFeature([Authenticator, LoginSession, User, BrainwaveDevice]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CaptchaService,
    JwtStrategy,
    WebauthnService,
    BiometricAuthService,
    GoogleStrategy,
    FacebookStrategy,
    GitHubStrategy,
    DiscordStrategy,
    TwitterStrategy,
    AppleStrategy,
  ],
  exports: [AuthService, WebauthnService, BiometricAuthService],
})
export class AuthModule {}