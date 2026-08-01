import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomAudience } from './entities/custom-audience.entity';
import { CustomAudiencesService } from './custom-audiences.service';
import { CustomAudiencesController } from './custom-audiences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomAudience])],
  controllers: [CustomAudiencesController],
  providers: [CustomAudiencesService],
})
export class CustomAudiencesModule {}
