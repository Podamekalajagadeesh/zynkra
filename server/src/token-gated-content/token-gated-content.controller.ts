import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TokenGatedContentService } from './token-gated-content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('token-gated')
export class TokenGatedContentController {
  constructor(private readonly tokenGatedContentService: TokenGatedContentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('content')
  async createContent(@Req() req, @Body() body: { name: string; description: string; tokenAddress: string; minTokenBalance: number }) {
    return this.tokenGatedContentService.createContent(req.user as User, body.name, body.description, body.tokenAddress, body.minTokenBalance);
  }

  @UseGuards(JwtAuthGuard)
  @Post('group')
  async createGroup(@Req() req, @Body() body: { name: string; description: string; tokenAddress: string; minTokenBalance: number }) {
    return this.tokenGatedContentService.createGroup(req.user as User, body.name, body.description, body.tokenAddress, body.minTokenBalance);
  }

  @Get('content/:id')
  async getContent(@Param('id') id: string) {
    return this.tokenGatedContentService.getContent(id);
  }

  @Get('group/:id')
  async getGroup(@Param('id') id: string) {
    return this.tokenGatedContentService.getGroup(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('group/:id/join')
  async joinGroup(@Req() req, @Param('id') id: string) {
    const group = await this.tokenGatedContentService.getGroup(id);
    if (!group) {
      // Handle group not found
      return;
    }
    return this.tokenGatedContentService.joinGroup(req.user as User, group);
  }
}