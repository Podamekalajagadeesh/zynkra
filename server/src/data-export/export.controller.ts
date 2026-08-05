import { Body, Controller, Get, Post, Delete, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService, ExportData } from './export.service';
import { Response } from 'express';

@Controller('data-export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('info')
  @UseGuards(JwtAuthGuard)
  async getExportInfo(@Req() req) {
    return this.exportService.getExportInfo(req.user.userId || req.user.id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  async importData(@Req() req, @Body() body: ExportData) {
    return this.exportService.importFromJson(req.user.userId || req.user.id, body);
  }

  @Get('download')
  @UseGuards(JwtAuthGuard)
  async downloadData(@Req() req, @Res() res: Response) {
    const data = await this.exportService.exportAsJson(req.user.userId || req.user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="zynkra-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(data);
  }

  @Delete('delete-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAllData(@Req() req) {
    return this.exportService.deleteAllUserData(req.user.userId || req.user.id);
  }
}
