import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Authenticator } from './entities/authenticator.entity';
import { EmailModule } from '../email/email.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WebauthnService } from './webauthn.service';
import { LoginSession } from './entities/login-session.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    EmailModule,
    forwardRef(() => NotificationsModule),
    TypeOrmModule.forFeature([Authenticator, LoginSession]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WebauthnService,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}