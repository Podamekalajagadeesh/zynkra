
import { Controller, Post, Body } from '@nestjs/common';
import { TippingService } from './tipping.service';
import { CreateTipDto } from './dto/create-tip.dto';

@Controller('tipping')
export class TippingController {
  constructor(private readonly tippingService: TippingService) {}

  @Post()
  create(@Body() createTipDto: CreateTipDto) {
    return this.tippingService.create(createTipDto);
  }
}