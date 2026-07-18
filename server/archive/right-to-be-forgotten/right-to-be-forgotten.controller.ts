import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RightToBeForgottenService } from './right-to-be-forgotten.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ErasureStatus } from './entities/erasure-request.entity';

@Controller('right-to-be-forgotten')
@UseGuards(JwtAuthGuard)
export class RightToBeForgottenController {
  constructor(private readonly rightToBeForgottenService: RightToBeForgottenService) {}

  @Post('request')
  async createRequest(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.rightToBeForgottenService.createErasureRequest(userId, body);
  }

  @Get('my-requests')
  async getMyRequests(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.rightToBeForgottenService.getUserRequests(userId);
  }

  @Get('all')
  async getAllRequests() {
    return this.rightToBeForgottenService.getAllRequests();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ErasureStatus; erasedItems?: any },
  ) {
    return this.rightToBeForgottenService.updateRequestStatus(
      id,
      body.status,
      body.erasedItems,
    );
  }

  @Patch(':id/cancel')
  async cancelRequest(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.rightToBeForgottenService.cancelRequest(id, userId);
  }

  @Get('stats')
  async getStats() {
    return this.rightToBeForgottenService.getStats();
  }
}
