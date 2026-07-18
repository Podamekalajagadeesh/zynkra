import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { OpenSourceService } from './opensource.service';
import { OpenSourceController } from './opensource.controller';
import { Contribution } from './entities/contribution.entity';
import { User } from '../users/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contribution, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OpenSourceController],
  providers: [OpenSourceService],
  exports: [OpenSourceService],
})
export class OpenSourceModule {}