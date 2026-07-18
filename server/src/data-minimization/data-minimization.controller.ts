import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { DataMinimizationService } from './data-minimization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { DataPurpose } from './entities/data-collection-log.entity';

@Controller('data-minimization')
export class DataMinimizationController {
  constructor(private readonly dataMinimizationService: DataMinimizationService) {}

  @Get('policy')
  async getPolicy() {
    return this.dataMinimizationService.getPolicy();
  }

  @Patch('policy')
  async updatePolicy(@Body() body: any) {
    return this.dataMinimizationService.updatePolicy(body);
  }

  @Post('log')
  async logCollection(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.id;
    return this.dataMinimizationService.logDataCollection(
      userId,
      body.dataTypes,
      body.purpose || DataPurpose.CONTENT,
      body.necessary !== false,
      body.minimal !== false,
      body.collectionDetails,
    );
  }

  @Get('logs/my')
  @UseGuards(JwtAuthGuard)
  async getMyLogs(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.dataMinimizationService.getUserLogs(userId);
  }

  @Get('logs/all')
  async getAllLogs() {
    return this.dataMinimizationService.getAllLogs();
  }

  @Get('stats')
  async getStats() {
    return this.dataMinimizationService.getStats();
  }
}
