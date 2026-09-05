import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { DataPermissionsService } from './data-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [DataPermissionsService],
  exports: [DataPermissionsService],
})
export class DataPermissionsModule {}