import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InterstellarConnectionService } from './interstellar-connection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('interstellar-connection')
export class InterstellarConnectionController {
  constructor(private readonly interstellarConnectionService: InterstellarConnectionService) {}

  @Get('locations')
  async getAllLocations() {
    return this.interstellarConnectionService.getAllLocations();
  }

  @Get('locations/:id')
  async getLocation(@Param('id') id: string) {
    return this.interstellarConnectionService.getLocationById(id);
  }

  @Post('locations')
  async createLocation(@Body() body: any) {
    return this.interstellarConnectionService.createLocation(body);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.interstellarConnectionService.sendMessage(userId, body);
  }

  @Get('messages/my')
  @UseGuards(JwtAuthGuard)
  async getMyMessages(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.interstellarConnectionService.getMessages({
      userId,
      senderId: userId,
      recipientId: userId,
    });
  }

  @Get('messages/sent')
  @UseGuards(JwtAuthGuard)
  async getSentMessages(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.interstellarConnectionService.getMessages({ senderId: userId });
  }

  @Get('messages/received')
  @UseGuards(JwtAuthGuard)
  async getReceivedMessages(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.interstellarConnectionService.getMessages({ recipientId: userId });
  }

  @Get('messages/broadcast')
  async getBroadcastMessages() {
    return this.interstellarConnectionService.getMessages({ isBroadcast: true });
  }
}
