import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityGateway } from './activity.gateway';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [ActivityGateway],
  exports: [ActivityGateway],
})
export class ActivityModule {}