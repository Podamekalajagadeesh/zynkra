import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MemoryConsentService } from './memory-consent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { RedactionLevel } from './entities/memory-share-consent.entity';

@Controller('memory-consent')
@UseGuards(JwtAuthGuard)
export class MemoryConsentController {
  constructor(private readonly memoryConsentService: MemoryConsentService) {}

  @Post('request')
  async createConsentRequest(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.createConsentRequest(
      userId,
      body.memoryId,
      body.recipientIds,
      body.includedUserIds || [],
      body.requestMessage,
    );
  }

  @Get('my/requests')
  async getMyRequests(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.getUserConsents(userId, 'requester');
  }

  @Get('my/pending')
  async getMyPending(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.getUserConsents(userId, 'recipient');
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.getConsentStats(userId);
  }

  @Get(':id')
  async getConsent(@Param('id') id: string) {
    return this.memoryConsentService.getConsentById(id);
  }

  @Patch(':id/grant')
  async grantConsent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.grantConsent(
      id,
      userId,
      body.grantedRedactionLevels || {},
      body.responseMessage,
    );
  }

  @Patch(':id/revoke')
  async revokeConsent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.revokeConsent(
      id,
      userId,
      body.responseMessage,
    );
  }

  @Get('rules/my')
  async getMyRules(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.getUserRedactionRules(userId);
  }

  @Post('rules')
  async createRule(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.createRedactionRule(userId, body);
  }

  @Patch('rules/:id')
  async updateRule(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any).id;
    return this.memoryConsentService.updateRedactionRule(id, userId, body);
  }

  @Delete('rules/:id')
  async deleteRule(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    await this.memoryConsentService.deleteRedactionRule(id, userId);
    return { success: true };
  }
}
