import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { SnapMapGateway } from './snapmap.gateway';

@Module({
  imports: [
    UsersModule,
  ],
  providers: [SnapMapGateway],
  exports: [SnapMapGateway],
})
export class SnapMapModule {}