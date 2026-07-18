import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DigitalInheritanceService } from './digital-inheritance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('digital-inheritance')
export class DigitalInheritanceController {
  constructor(private readonly inheritanceService: DigitalInheritanceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createInheritance(@Req() req: Request, @Body() body: any) {
    const ownerId = (req.user as any).id;
    return this.inheritanceService.createInheritance(ownerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOwnerInheritances(@Req() req: Request) {
    const ownerId = (req.user as any).id;
    return this.inheritanceService.getInheritancesForOwner(ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getInheritance(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.inheritanceService.getInheritanceById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateInheritance(@Param('id') id: string, @Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.inheritanceService.updateInheritance(id, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/activate')
  async activateInheritance(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.inheritanceService.activateInheritance(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelInheritance(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.inheritanceService.cancelInheritance(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('beneficiary/my')
  async getBeneficiaryInheritances(@Req() req: Request) {
    const beneficiaryId = (req.user as any).id;
    return this.inheritanceService.getInheritancesForBeneficiary(beneficiaryId);
  }
}
