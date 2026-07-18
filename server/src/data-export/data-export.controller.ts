
import { Controller, Post, UseGuards, Request, Get, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataExportService } from './data-export.service';

@Controller()
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  @UseGuards(JwtAuthGuard)
  @Post('data-export')
  async create(@Request() req) {
    return this.dataExportService.create(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('data-export')
  async getExport(@Request() req) {
    return this.dataExportService.getExport(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('data-deletion')
  async requestDeletion(@Request() req) {
    return this.dataExportService.initiateDeletion(req.user);
  }
}