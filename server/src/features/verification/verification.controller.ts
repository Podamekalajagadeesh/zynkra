import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VerificationService } from './verification.service';
import { CreateVerificationRequestDto, ApproveVerificationRequestDto, RejectVerificationRequestDto, AppealVerificationDecisionDto } from './dto/create-verification-request.dto';
import { VerificationRequestStatus } from './entities/verification-request.entity';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // ============ VERIFICATION REQUESTS ============

  @Post('requests')
  async submitVerificationRequest(@Request() req, @Body() createDto: CreateVerificationRequestDto) {
    return this.verificationService.submitVerificationRequest(req.user.userId, createDto);
  }

  @Get('requests')
  async getUserVerificationRequests(@Request() req) {
    return this.verificationService.getUserVerificationRequests(req.user.userId);
  }

  @Get('requests/:requestId')
  async getVerificationRequest(@Request() req, @Param('requestId') requestId: string) {
    const request = await this.verificationService.getVerificationRequest(requestId);
    // Allow user to view their own request or admins to view any
    if (request.userId !== req.user.userId && req.user.role !== 'admin') {
      throw new BadRequestException('You do not have permission to view this request');
    }
    return request;
  }

  // ============ VERIFICATION APPROVAL (ADMIN ONLY) ============

  @Get('admin/requests/pending')
  @UseGuards(JwtAuthGuard) // Should check admin role
  async getPendingVerifications(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const [requests, total] = await this.verificationService.getAllPendingVerifications(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    return { requests, total };
  }

  @Post('admin/requests/:requestId/approve')
  async approveVerificationRequest(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body() approveDto: ApproveVerificationRequestDto,
  ) {
    // Should validate that req.user has admin role
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can approve verification requests');
    }
    return this.verificationService.approveVerificationRequest(requestId, req.user.userId, approveDto);
  }

  @Post('admin/requests/:requestId/reject')
  async rejectVerificationRequest(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body() rejectDto: RejectVerificationRequestDto,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can reject verification requests');
    }
    return this.verificationService.rejectVerificationRequest(requestId, req.user.userId, rejectDto);
  }

  @Post('admin/requests/:requestId/under-review')
  async markUnderReview(@Request() req, @Param('requestId') requestId: string) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can mark requests as under review');
    }
    return this.verificationService.markUnderReview(requestId, req.user.userId);
  }

  // ============ BADGES ============

  @Get('badges')
  async getUserBadges(@Request() req) {
    return this.verificationService.getUserBadges(req.user.userId);
  }

  @Post('admin/badges/:userId/grant')
  async grantBadge(@Request() req, @Param('userId') userId: string, @Body() body: { badgeType: string }) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can grant badges');
    }
    return this.verificationService.grantBadge(userId, body.badgeType as any, req.user.userId);
  }

  @Post('admin/badges/:badgeId/revoke')
  async revokeBadge(@Request() req, @Param('badgeId') badgeId: string, @Body() body: { reason: string }) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can revoke badges');
    }
    return this.verificationService.revokeBadge(badgeId, body.reason, req.user.userId);
  }

  // ============ VERIFICATION APPEALS ============

  @Post('appeals')
  async submitAppeal(@Request() req, @Body() body: { requestId: string; appealDto: AppealVerificationDecisionDto }) {
    return this.verificationService.submitAppeal(body.requestId, req.user.userId, body.appealDto);
  }

  @Get('appeals')
  async getUserAppeals(@Request() req) {
    return this.verificationService.getUserAppeals(req.user.userId);
  }

  @Post('admin/appeals/:appealId/approve')
  async approveAppeal(@Request() req, @Param('appealId') appealId: string) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can approve appeals');
    }
    return this.verificationService.approveAppeal(appealId, req.user.userId);
  }

  @Post('admin/appeals/:appealId/reject')
  async rejectAppeal(@Request() req, @Param('appealId') appealId: string, @Body() body: { notes: string }) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can reject appeals');
    }
    return this.verificationService.rejectAppeal(appealId, req.user.userId, body.notes);
  }

  // ============ VERIFICATION HISTORY ============

  @Get('history')
  async getVerificationHistory(@Request() req, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const [history, total] = await this.verificationService.getUserVerificationHistory(
      req.user.userId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    return { history, total };
  }

  // ============ STATISTICS ============

  @Get('stats')
  async getVerificationStats(@Request() req) {
    return this.verificationService.getVerificationStats(req.user.userId);
  }
}
