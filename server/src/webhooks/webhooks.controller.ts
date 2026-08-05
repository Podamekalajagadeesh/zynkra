import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import {
  CreateWebhookEndpointDto,
  UpdateWebhookEndpointDto,
} from './dto/create-webhook-endpoint.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }
    return this.webhooksService.handleStripeWebhook(req.rawBody, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Post('endpoints')
  createEndpoint(@Req() req, @Body() dto: CreateWebhookEndpointDto) {
    return this.webhooksService.createEndpoint(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('endpoints')
  listEndpoints(@Req() req) {
    return this.webhooksService.listEndpoints(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('endpoints/:id')
  updateEndpoint(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookEndpointDto,
  ) {
    return this.webhooksService.updateEndpoint(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEndpoint(@Req() req, @Param('id') id: string): Promise<void> {
    return this.webhooksService.deleteEndpoint(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('endpoints/:id/rotate-secret')
  rotateSecret(@Req() req, @Param('id') id: string) {
    return this.webhooksService.rotateSecret(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('endpoints/:id/deliveries')
  getDeliveries(@Req() req, @Param('id') id: string) {
    return this.webhooksService.getDeliveries(req.user.userId, id);
  }
}
