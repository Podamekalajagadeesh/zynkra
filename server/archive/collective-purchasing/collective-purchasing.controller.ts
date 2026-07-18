import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CollectivePurchasingService } from './collective-purchasing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('collective-purchasing')
export class CollectivePurchasingController {
  constructor(private readonly purchasingService: CollectivePurchasingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPurchase(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.purchasingService.createPurchase(userId, body);
  }

  @Get()
  async getAllPurchases() {
    return this.purchasingService.getAllPurchases();
  }

  @Get(':id')
  async getPurchase(@Param('id') id: string) {
    return this.purchasingService.getPurchaseById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinPurchase(@Param('id') id: string, @Req() req: Request, @Body() body: { amount: number }) {
    const userId = (req.user as any).id;
    return this.purchasingService.joinPurchase(userId, id, body.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelPurchase(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.purchasingService.cancelPurchase(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/my')
  async getUserPurchases(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.purchasingService.getUserPurchases(userId);
  }
}
