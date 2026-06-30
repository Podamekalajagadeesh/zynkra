import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { AffiliateLink } from './entities/affiliate-link.entity';
import { AffiliateClick } from './entities/affiliate-click.entity';
import { AffiliateConversion } from './entities/affiliate-conversion.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateLink, AffiliateClick, AffiliateConversion, User]),
    UsersModule,
  ],
  providers: [AffiliatesService],
  controllers: [AffiliatesController],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}