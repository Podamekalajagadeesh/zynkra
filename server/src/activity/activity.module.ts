import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityGateway } from './activity.gateway';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [ActivityController],
  providers: [ActivityGateway, ActivityService],
  exports: [ActivityGateway, ActivityService],
})
export class ActivityModule {}
