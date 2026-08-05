import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteCodeAdminGuard } from './invite-code-admin.guard';
import { InviteCodesService } from './invite-codes.service';

@Controller('invite-codes')
@UseGuards(JwtAuthGuard, InviteCodeAdminGuard)
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post()
  create(
    @Request() req,
    @Body() body: { maxUses?: number; expiresInDays?: number },
  ) {
    return this.inviteCodesService.generateCode(req.user.userId, {
      maxUses: body.maxUses,
      expiresInDays: body.expiresInDays,
    });
  }

  @Get()
  list() {
    return this.inviteCodesService.list();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inviteCodesService.remove(id);
  }
}
