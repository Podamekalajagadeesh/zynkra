import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoicesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(req.user.userId, id, dto);
  }

  @Post(':id/mark-paid')
  markPaid(@Request() req, @Param('id') id: string) {
    return this.invoicesService.markPaid(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.invoicesService.remove(req.user.userId, id);
  }
}
