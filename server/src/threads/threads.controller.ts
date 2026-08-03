import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendThreadMessageDto } from './dto/send-thread-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateThreadDto) {
    return this.threadsService.createThread(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.threadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendThreadMessageDto, @Request() req) {
    return this.threadsService.sendMessage(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.threadsService.deleteThread(id, req.user.userId);
  }

  @Delete(':threadId/messages/:messageId')
  removeMessage(
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
    @Request() req,
  ) {
    return this.threadsService.deleteMessage(threadId, messageId, req.user.userId);
  }
}
