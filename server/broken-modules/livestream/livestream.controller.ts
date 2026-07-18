import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { LivestreamService } from './livestream.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { CreateStreamDto } from './dto/create-stream.dto';

@Controller('livestream')
export class LivestreamController {
  constructor(private readonly livestreamService: LivestreamService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createStreamDto: CreateStreamDto) {
    return this.livestreamService.createStream(
      req.user.userId,
      createStreamDto.title,
      createStreamDto.description,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getStream(@Request() req) {
    return this.livestreamService.getStreamByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('key')
  async getStreamKey(@Request() req) {
    const stream = await this.livestreamService.getStreamByUser(req.user.userId);
    if (!stream) {
      throw new Error('Stream not found');
    }
    return { streamKey: stream.streamKey };
  }
}