import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntergenerationalSpacesService } from './intergenerational-spaces.service';
import { IntergenerationalSpacesController } from './intergenerational-spaces.controller';
import { IntergenerationalSpace, IntergenerationalSpaceMember } from './entities/intergenerational-space.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntergenerationalSpace, IntergenerationalSpaceMember])],
  controllers: [IntergenerationalSpacesController],
  providers: [IntergenerationalSpacesService],
  exports: [IntergenerationalSpacesService],
})
export class IntergenerationalSpacesModule {}
