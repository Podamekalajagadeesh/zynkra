import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ModerationService } from './services/moderation.service';
import { NeuralModerationService } from './services/neural-moderation.service';
import { AnalyzeContentDto } from './dto/analyze-content.dto';
import { AppealModerationDto } from './dto/appeal-moderation.dto';
import { AnalyzeNeuralThoughtDto } from './dto/analyze-neural-thought.dto';
import { AppealNeuralModerationDto } from './dto/appeal-neural-moderation.dto';
import { AnalyzeBiasDto } from './dto/analyze-bias.dto';
import { ApplyMitigationsDto } from './dto/apply-mitigations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly neuralModerationService: NeuralModerationService
  ) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeContent(@Body() analyzeContentDto: AnalyzeContentDto) {
    return this.moderationService.analyzeContent(analyzeContentDto);
  }

  // Neural moderation endpoints for thought-to-post and telepathic communication
  @Post('neural/analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeNeuralThought(@Body() analyzeNeuralThoughtDto: AnalyzeNeuralThoughtDto) {
    return this.neuralModerationService.analyzeNeuralThought(analyzeNeuralThoughtDto);
  }

  @Post('neural/:id/appeal')
  @UseGuards(JwtAuthGuard)
  async appealNeuralModeration(
    @Body() appealNeuralModerationDto: AppealNeuralModerationDto,
    @CurrentUser() user: any
  ) {
    return this.neuralModerationService.appealNeuralModeration(appealNeuralModerationDto, user.id);
  }

  @Get('neural/user')
  @UseGuards(JwtAuthGuard)
  async getUserNeuralFlags(@CurrentUser() user: any) {
    return this.neuralModerationService.getUserNeuralFlags(user.id);
  }

  @Get('queue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getModerationQueue(@Query('status') status?: string) {
    return this.moderationService.getModerationQueue(status);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveContent(@Param('id') id: string) {
    return this.moderationService.approveContent(id);
  }

  @Post(':id/remove')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeContent(@Param('id') id: string) {
    return this.moderationService.removeContent(id);
  }

  @Post(':id/appeal')
  @UseGuards(JwtAuthGuard)
  async appealModerationDecision(
    @Param('id') id: string,
    @Body() appealModerationDto: AppealModerationDto
  ) {
    return this.moderationService.appealModerationDecision(id, appealModerationDto.appealReason);
  }

  // Bias detection and mitigation endpoints
  @Post('bias/analyze')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async analyzeBias(@Body() analyzeBiasDto: AnalyzeBiasDto) {
    return this.moderationService.analyzeBias(analyzeBiasDto.feedContent, analyzeBiasDto.interactionContext);
  }

  @Get('bias/feed-metrics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getFeedRepresentationMetrics(@Query('timeframe') timeframe?: string) {
    return this.moderationService.getFeedRepresentationMetrics(timeframe);
  }

  @Post('bias/apply-mitigations')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async applyBiasMitigations(@Body() applyMitigationsDto: ApplyMitigationsDto) {
    return this.moderationService.applyBiasMitigations(applyMitigationsDto.mitigationStrategy);
  }
}