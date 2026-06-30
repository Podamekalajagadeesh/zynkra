import { Controller, Get, Post, Req, Res, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request, Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}


}