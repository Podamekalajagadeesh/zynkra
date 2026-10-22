import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('import-zip')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async importZip(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Zip archive required (multipart field "file").');
    }
    return this.exportService.importFromZip(req.user.userId || req.user.id, file.buffer);
  }

  @Get('download')
  @UseGuards(JwtAuthGuard)
  async downloadData(@Req() req, @Res() res: Response) {
    const data = await this.exportService.exportAsJson(req.user.userId || req.user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zynkra-export-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.send(data);
  }

  @Delete('delete-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAllData(@Req() req) {
    return this.exportService.deleteAllUserData(req.user.userId || req.user.id);
  }
}
