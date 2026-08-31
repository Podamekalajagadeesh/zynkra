import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DmsService } from './dms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { VanishModeDto } from './dto/vanish-mode.dto';
import { MessageTtlDto } from './dto/message-ttl.dto';

@Controller('dms')
@UseGuards(JwtAuthGuard)
export class DmsController {
  constructor(
    private readonly dmsService: DmsService,
    private readonly usersService: UsersService,
  ) {}

  @Patch('conversations/:conversationId/vanish-mode')
  async setVanishMode(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() vanishModeDto: VanishModeDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.setVanishMode(
      user,
      conversationId,
      vanishModeDto.vanishMode,
    );
  }

  @Patch('conversations/:conversationId/message-ttl')
  async setMessageTtl(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() messageTtlDto: MessageTtlDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.setMessageTtl(
      user,
      conversationId,
      messageTtlDto.messageTtlSeconds ?? null,
    );
  }

  @Post('messages/:messageId/forward')
  async forwardMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() forwardMessageDto: ForwardMessageDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.forwardMessage(
      user,
      messageId,
      forwardMessageDto,
    );
  }

  @Post('conversations')
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const starter = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.createConversation(
      starter,
      createConversationDto.recipientIds,
      createConversationDto.name,
    );
  }

  @Post(':conversationId/messages')
  async sendMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    if (!sendMessageDto.content && !sendMessageDto.media) {
      throw new BadRequestException('Message must have content or a media file.');
    }
    const sender = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.sendMessage(
      sender,
      conversationId,
      sendMessageDto,
    );
  }

  @Post('messages/:messageId/reactions')
  async addReaction(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() addReactionDto: AddReactionDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.addReaction(
      user,
      messageId,
      addReactionDto.reaction,
    );
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.getConversations(user);
  }

  @Post('conversations/:conversationId/read')
  async markConversationAsRead(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.markConversationAsRead(user, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.getMessages(user, conversationId);
  }

  @Post('messages/:messageId/read')
  async markMessageAsRead(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.markMessageAsRead(user, messageId);
  }

  @Patch('messages/:messageId')
  async updateMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.dmsService.updateMessage(
      user,
      messageId,
      updateMessageDto.content,
    );
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Request() req,
    @Param('messageId') messageId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    await this.dmsService.deleteMessage(user, messageId);
  }
}