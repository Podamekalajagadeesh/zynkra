import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Delete,
  Param,
  Res,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataExportService } from './data-export.service';

@Controller()
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  /**
   * Owner-only archive download. Export zips contain the full account
   * (private DMs included) and live outside the publicly served uploads
   * directory — this route is the only way to fetch one, and only for its
   * owning user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('data-export/archive/:id')
  async downloadArchive(@Request() req, @Param('id') id: string, @Res() res: Response) {
    const userId = req.user.userId || req.user.id;
    const filePath = await this.dataExportService.getArchivePath(userId, id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zynkra-export-${new Date().toISOString().split('T')[0]}.zip"`
    );
    createReadStream(filePath).pipe(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('data-export/schedule')
  async getSchedule(@Request() req) {
    return this.dataExportService.getSchedule(req.user.userId || req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-export/schedule')
  @HttpCode(HttpStatus.OK)
  async updateSchedule(@Request() req, @Body() body: { enabled?: boolean; intervalDays?: number }) {
    return this.dataExportService.updateSchedule(req.user.userId || req.user.id, body ?? {});
  }

  @UseGuards(JwtAuthGuard)
  @Get('data-export/history')
  async getHistory(@Request() req) {
    return this.dataExportService.listHistory(req.user.userId || req.user.id);
  }

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
