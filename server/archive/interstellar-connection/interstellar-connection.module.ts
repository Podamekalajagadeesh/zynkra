import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterstellarConnectionService } from './interstellar-connection.service';
import { InterstellarConnectionController } from './interstellar-connection.controller';
import { SpaceLocation, InterstellarMessage } from './entities/space-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceLocation, InterstellarMessage])],
  controllers: [InterstellarConnectionController],
  providers: [InterstellarConnectionService],
  exports: [InterstellarConnectionService],
})
export class InterstellarConnectionModule {}
