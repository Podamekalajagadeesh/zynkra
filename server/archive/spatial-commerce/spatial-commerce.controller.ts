import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SpatialCommerceService } from './spatial-commerce.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('spatial-commerce')
export class SpatialCommerceController {
  constructor(private readonly commerceService: SpatialCommerceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createStorefront(@Req() req: Request, @Body() body: any) {
    const ownerId = (req.user as any).id;
    return this.commerceService.createStorefront(ownerId, body);
  }

  @Get()
  async getAllStorefronts() {
    return this.commerceService.getAllStorefronts();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyStorefronts(@Req() req: Request) {
    const ownerId = (req.user as any).id;
    return this.commerceService.getStorefrontsByOwner(ownerId);
  }

  @Get(':id')
  async getStorefront(@Param('id') id: string) {
    return this.commerceService.getStorefrontById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateStorefront(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const ownerId = (req.user as any).id;
    return this.commerceService.updateStorefront(id, ownerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteStorefront(@Param('id') id: string, @Req() req: Request) {
    const ownerId = (req.user as any).id;
    return this.commerceService.deleteStorefront(id, ownerId);
  }
}
