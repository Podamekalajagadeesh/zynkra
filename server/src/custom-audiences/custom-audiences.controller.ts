import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomAudiencesService } from './custom-audiences.service';

@Controller('users/me/custom-audiences')
@UseGuards(JwtAuthGuard)
export class CustomAudiencesController {
  constructor(private readonly customAudiencesService: CustomAudiencesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.customAudiencesService.listForUser(this.getUserId(req));
  }

  @Post()
  create(@Req() req: Request, @Body() body: { name?: string }) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      throw new BadRequestException('name is required');
    }
    return this.customAudiencesService.create(this.getUserId(req), name);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { name?: string; userIds?: string[] },
  ) {
    return this.customAudiencesService.update(this.getUserId(req), id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    await this.customAudiencesService.remove(this.getUserId(req), id);
  }

  // The JWT strategy exposes userId (with id present on some auth paths) — read both.
  private getUserId(req: Request): string {
    const user = req.user as { userId?: string; id?: string } | undefined;
    return user?.userId || user?.id || '';
  }
}
