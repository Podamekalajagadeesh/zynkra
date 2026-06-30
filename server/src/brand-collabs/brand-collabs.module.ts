import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandCollabsService } from './brand-collabs.service';
import { BrandCollabsController } from './brand-collabs.controller';
import { Brand } from './entities/brand.entity';
import { CollabOpportunity } from './entities/collab-opportunity.entity';
import { CollabApplication } from './entities/collab-application.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, CollabOpportunity, CollabApplication, User]),
    UsersModule,
  ],
  providers: [BrandCollabsService],
  controllers: [BrandCollabsController],
  exports: [BrandCollabsService],
})
export class BrandCollabsModule {}