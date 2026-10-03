import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SnapMapGateway } from './snapmap.gateway';
import { LocationService } from './location.service';

@Module({
  imports: [UsersModule],
  providers: [SnapMapGateway, LocationService],
  // LocationService is exported so FeedService can read shared locations
  // without reaching into the gateway's internals.
  exports: [SnapMapGateway, LocationService],
})
export class SnapMapModule {}
