import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { VisibilityService } from './visibility.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class VisibilityModule {}
