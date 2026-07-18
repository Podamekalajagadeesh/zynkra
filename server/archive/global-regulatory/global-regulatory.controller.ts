import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GlobalRegulatoryService } from './global-regulatory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StandardCategory } from './entities/regulatory-standard.entity';

@Controller('global-regulatory')
export class GlobalRegulatoryController {
  constructor(private readonly globalRegulatoryService: GlobalRegulatoryService) {}

  @Get('standards')
  async getAllStandards(@Param('category') category?: StandardCategory) {
    return this.globalRegulatoryService.getAllStandards(category);
  }

  @Get('standards/:id')
  async getStandard(@Param('id') id: string) {
    return this.globalRegulatoryService.getStandardById(id);
  }

  @Get('reports')
  async getAllReports() {
    return this.globalRegulatoryService.getAllComplianceReports();
  }

  @Get('reports/:id')
  async getReport(@Param('id') id: string) {
    return this.globalRegulatoryService.getComplianceReportById(id);
  }

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async createReport(@Body() body: any) {
    return this.globalRegulatoryService.createComplianceReport(body);
  }

  @Patch('reports/:id')
  @UseGuards(JwtAuthGuard)
  async updateReport(@Param('id') id: string, @Body() body: any) {
    return this.globalRegulatoryService.updateComplianceReport(id, body);
  }

  @Get('stats')
  async getStats() {
    return this.globalRegulatoryService.getComplianceStats();
  }
}
