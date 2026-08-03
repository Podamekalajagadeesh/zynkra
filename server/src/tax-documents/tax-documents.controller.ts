import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaxDocumentsService } from './tax-documents.service';

@Controller('tax-documents')
@UseGuards(JwtAuthGuard)
export class TaxDocumentsController {
  constructor(private readonly taxDocumentsService: TaxDocumentsService) {}

  @Get()
  list(@Request() req) {
    return this.taxDocumentsService.list(req.user.userId);
  }

  @Post('generate/:year')
  generate(@Request() req, @Param('year', ParseIntPipe) year: number) {
    return this.taxDocumentsService.generate(req.user.userId, year);
  }

  @Get(':id/download')
  async download(@Request() req, @Param('id') id: string, @Res() res: Response) {
    const document = await this.taxDocumentsService.getDocument(req.user.userId, id);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zynkra-1099-${document.taxYear}.txt"`,
    );
    res.send(this.taxDocumentsService.renderAsText(document));
  }
}
