import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NeuralPrivacyService } from './neural-privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { NeuralContentType } from './entities/neural-privacy-setting.entity';

@Controller('neural-privacy')
@UseGuards(JwtAuthGuard)
export class NeuralPrivacyController {
  constructor(private readonly neuralPrivacyService: NeuralPrivacyService) {}

  @Get('settings')
  async getMySettings(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralPrivacyService.getUserSettings(userId);
  }

  @Patch('settings/:contentType')
  async updateSetting(
    @Req() req: Request,
    @Param('contentType') contentType: NeuralContentType,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.neuralPrivacyService.updateSetting(userId, contentType, body);
  }

  @Post('temp-access')
  async grantTempAccess(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neuralPrivacyService.grantTempAccess(
      userId,
      body.contentType,
      body.allowedUserIds,
      body.durationHours || 24,
    );
  }

  @Post('temp-access/revoke')
  async revokeTempAccess(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.neuralPrivacyService.revokeTempAccess(userId, body.contentType);
  }

  @Get('access-logs')
  async getAccessLogs(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.neuralPrivacyService.getAccessLogs(userId);
  }
}
