
import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { UsersModule } from '../../src/users/users.module';
import { AdsManagerService } from '../../src/ads-manager.service';

@Module({
  imports: [UsersModule],
  controllers: [AdsController],
  providers: [AdsService, AdsManagerService],
})
export class AdsModule {}