import { Module } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { LiveKitGateway } from './livekit.gateway';

@Module({
  providers: [LiveKitService, LiveKitGateway],
  exports: [LiveKitService],
})
export class LiveKitModule {}