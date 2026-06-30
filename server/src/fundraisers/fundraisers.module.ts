import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundraisersService } from './fundraisers.service';
import { FundraisersController } from './fundraisers.controller';
import { Fundraiser } from './entities/fundraiser.entity';
import { Donation } from './entities/donation.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fundraiser, Donation]), PaymentsModule],
  providers: [FundraisersService],
  controllers: [FundraisersController],
})
export class FundraisersModule {}