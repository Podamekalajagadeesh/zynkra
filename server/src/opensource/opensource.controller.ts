import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OpenSourceService } from './opensource.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { ContributionStatus, ContributionType } from './entities/contribution.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('opensource')
export class OpenSourceController {
  constructor(private readonly openSourceService: OpenSourceService) {}

  @Post('contributions')
  @UseGuards(JwtAuthGuard)
  async createContribution(@Req() req, @Body() createDto: CreateContributionDto) {
    return this.openSourceService.createContribution(req.user.userId, createDto);
  }

  @Get('contributions')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Req() req,
    @Query('status') status?: ContributionStatus,
    @Query('type') type?: ContributionType,
  ) {
    return this.openSourceService.findAll({ status, type });
  }

  @Get('contributions/stats')
  async getStats() {
    return this.openSourceService.getContributionStats();
  }

  @Get('contributions/user/:userId')
  @UseGuards(JwtAuthGuard)
  async findUserContributions(@Param('userId') userId: string) {
    return this.openSourceService.findUserContributions(userId);
  }

  @Get('contributions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.openSourceService.findOne(id);
  }

  @Put('contributions/:id')
  @UseGuards(JwtAuthGuard)
  async updateContribution(
    @Param('id') id: string,
    @Req() req,
    @Body() updateDto: UpdateContributionDto,
  ) {
    const isAdmin = req.user.isAdmin || false;
    return this.openSourceService.updateContribution(id, req.user.userId, isAdmin, updateDto);
  }

  @Post('contributions/:id/assign-reviewer')
  @UseGuards(JwtAuthGuard)
  async assignReviewer(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId: string,
    @Req() req,
  ) {
    const isAdmin = req.user.isAdmin || false;
    if (!isAdmin) {
      throw new Error('Only admins can assign reviewers');
    }
    return this.openSourceService.assignReviewer(id, reviewerId);
  }

  @Delete('contributions/:id')
  @UseGuards(JwtAuthGuard)
  async deleteContribution(@Param('id') id: string, @Req() req) {
    const isAdmin = req.user.isAdmin || false;
    await this.openSourceService.deleteContribution(id, req.user.userId, isAdmin);
    return { success: true };
  }
}