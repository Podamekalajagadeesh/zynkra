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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

// Bundles live on their own path so the existing GET /subscriptions/:id route
// can't swallow /subscriptions/bundles as an id.
@Controller('subscription-bundles')
export class BundlesController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateBundleDto) {
    return this.subscriptionsService.createBundle(req.user.userId, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('creator/:creatorId')
  listCreatorBundles(@Param('creatorId') creatorId: string) {
    return this.subscriptionsService.getCreatorBundles(creatorId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.subscriptionsService.getBundle(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateBundleDto) {
    return this.subscriptionsService.updateBundle(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.deleteBundle(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/purchase')
  purchase(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.purchaseBundle(req.user.userId, id);
  }
}
