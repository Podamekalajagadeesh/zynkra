import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectedAccountsService } from './connected-accounts.service';

@Controller('connected-accounts')
@UseGuards(JwtAuthGuard)
export class ConnectedAccountsController {
  constructor(private readonly connectedAccountsService: ConnectedAccountsService) {}

  @Get()
  list(@Req() req: Request) {
    return this.connectedAccountsService.listForUser(this.getUserId(req));
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { platform: string; apiKey?: string; apiSecret?: string; accessToken?: string },
  ) {
    if (!body?.platform) {
      throw new BadRequestException('platform is required');
    }
    return this.connectedAccountsService.create(this.getUserId(req), body);
  }

  @Patch(':id')
  updateActive(@Req() req: Request, @Param('id') id: string, @Body() body: { isActive?: boolean }) {
    return this.connectedAccountsService.updateActive(this.getUserId(req), id, body?.isActive ?? true);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    await this.connectedAccountsService.remove(this.getUserId(req), id);
  }

  // The JWT strategy exposes userId (with id present on some auth paths) — read both.
  private getUserId(req: Request): string {
    const user = req.user as { userId?: string; id?: string } | undefined;
    return user?.userId || user?.id || '';
  }
}
