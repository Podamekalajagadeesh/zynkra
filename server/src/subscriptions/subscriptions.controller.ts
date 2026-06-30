import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSubscriptionTierDto } from './dto/create-subscription-tier.dto';
import { UpdateSubscriptionTierDto } from './dto/update-subscription-tier.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(
    @Request() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(
      req.user.userId,
      createSubscriptionDto.creatorId,
      createSubscriptionDto.tier,
    );
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }

  @Get()
  getSubscriptions(@Request() req) {
    return this.subscriptionsService.getSubscriptions(req.user.userId);
  }

  @Get('subscribers')
  getSubscribers(@Request() req) {
    return this.subscriptionsService.getSubscribers(req.user.userId);
  }

  @Get(':id')
  getSubscription(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }

  // Subscription tier endpoints
  @Post('tiers')
  createTier(
    @Request() req,
    @Body() createSubscriptionTierDto: CreateSubscriptionTierDto,
  ) {
    return this.subscriptionsService.createSubscriptionTier(
      req.user.userId,
      createSubscriptionTierDto.name,
      createSubscriptionTierDto.price,
    );
  }

  @Get('tiers/creator/:creatorId')
  getCreatorTiers(@Param('creatorId') creatorId: string) {
    return this.subscriptionsService.getCreatorSubscriptionTiers(creatorId);
  }

  @Patch('tiers/:id')
  updateTier(
    @Request() req,
    @Param('id') id: string,
    @Body() updateSubscriptionTierDto: UpdateSubscriptionTierDto,
  ) {
    return this.subscriptionsService.updateSubscriptionTier(
      req.user.userId,
      id,
      updateSubscriptionTierDto,
    );
  }

  @Delete('tiers/:id')
  deleteTier(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.deleteSubscriptionTier(req.user.userId, id);
  }
}