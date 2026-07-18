import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { AdPreferencesService } from './ad-preferences.service';
import { AdPreference } from './entities/ad-preference.entity';

@Controller('ad-preferences')
@UseGuards(JwtAuthGuard)
export class AdPreferencesController {
  constructor(private adPreferencesService: AdPreferencesService) {}

  @Get()
  async getAdPreferences(@Request() req): Promise<AdPreference> {
    let adPreference = await this.adPreferencesService.findOneByUser(req.user);
    if (!adPreference) {
      adPreference = await this.adPreferencesService.create(req.user);
    }
    return adPreference;
  }

  @Put()
  async updateAdPreferences(
    @Request() req,
    @Body() updates: Partial<AdPreference>,
  ): Promise<AdPreference> {
    let adPreference = await this.adPreferencesService.findOneByUser(req.user);
    if (!adPreference) {
      adPreference = await this.adPreferencesService.create(req.user);
    }
    return this.adPreferencesService.update(adPreference, updates);
  }
}