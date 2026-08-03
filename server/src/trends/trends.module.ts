import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrendsService } from './trends.service';
import { TrendsController } from './trends.controller';
import { TrendsGateway } from './trends.gateway';
import { Trend } from './entities/trend.entity';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trend]),
    UsersModule,
    PlacesModule,
  ],
  controllers: [TrendsController],
  providers: [TrendsService, TrendsGateway],
  exports: [TrendsService],
})
export class TrendsModule {}