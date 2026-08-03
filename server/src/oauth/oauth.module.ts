import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthApp } from './entities/oauth-app.entity';
import { OAuthAuthorization } from './entities/oauth-authorization.entity';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OAuthApp, OAuthAuthorization]),
    UsersModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OAuthService],
  controllers: [OAuthController],
  exports: [OAuthService],
})
export class OAuthModule {}
