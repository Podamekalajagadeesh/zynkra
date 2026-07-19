import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  SetMetadata,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SendMessageDto } from '../dms/dto/send-message.dto';
import { GroupRoleGuard } from './guards/group-role.guard';
import { GroupRole } from './group-role.enum';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
// Community challenges imports
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
// Calendar and Todo imports
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateTodoItemDto } from './dto/update-todo-item.dto';
// ModMail imports
import { CreateModMailConversationDto } from './dto/create-modmail-conversation.dto';
import { ModMailMessageDto } from './dto/modmail-message.dto';

import { GroupPrivacyGuard } from './guards/group-privacy.guard';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getGroups(@Request() req) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.getGroups(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGroup(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createGroup(
      createGroupDto.name,
      user,
      createGroupDto.privacy,
      createGroupDto.isDao,
      createGroupDto.votingSystem,
      createGroupDto.tokenGated,
      createGroupDto.contractAddress,
      createGroupDto.requiredTokenBalance,
      createGroupDto.allowAnonymousPosting,
    );
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/channels')
  async getChannels(@Param('groupId') groupId: string) {
    return this.groupsService.getChannels(groupId);
  }

  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN, GroupRole.MODERATOR])
  @Post(':groupId/channels')
  async createChannel(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createChannel(
      groupId,
      createChannelDto.name,
      user,
      createChannelDto.type,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('channels/:channelId/join')
  async joinChannel(@Request() req, @Param('channelId') channelId: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.joinChannel(channelId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('channels/:channelId/leave')
  async leaveChannel(@Request() req, @Param('channelId') channelId: string) {
    return this.groupsService.leaveChannel(channelId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('channels/:channelId/messages')
  async getMessages(@Param('channelId') channelId: string) {
    return this.groupsService.getMessages(channelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('channels/:channelId/messages')
  async addMessage(
    @Request() req,
    @Param('channelId') channelId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.addMessage(
      channelId,
      sendMessageDto.content,
      user,
    );
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/members')
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupMembers(groupId);
  }

  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN])
  @Put(':groupId/members/:userId')
  async updateMemberRole(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(
      groupId,
      userId,
      updateMemberRoleDto.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':groupId/proposals')
  async createProposal(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createProposalDto: CreateProposalDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createProposal(
      groupId,
      user,
      createProposalDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':groupId/proposals')
  async getProposals(@Param('groupId') groupId: string) {
    return this.groupsService.getProposals(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/votes')
  async vote(
    @Request() req,
    @Param('proposalId') proposalId: string,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.vote(proposalId, user, createVoteDto);
  }

  // Community Challenges Endpoints
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN])
  @Post(':groupId/challenges')
  async createChallenge(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createChallengeDto: CreateChallengeDto,
  ) {
    createChallengeDto.groupId = groupId;
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createChallenge(createChallengeDto, user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/challenges')
  async getGroupChallenges(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupChallenges(groupId);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get('challenges/:challengeId')
  async getChallenge(@Param('challengeId') challengeId: string) {
    return this.groupsService.getChallenge(challengeId);
  }

  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN])
  @Put('challenges/:challengeId')
  async updateChallenge(
    @Request() req,
    @Param('challengeId') challengeId: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.updateChallenge(challengeId, updateChallengeDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('challenges/:challengeId/contributions')
  async addContribution(
    @Request() req,
    @Param('challengeId') challengeId: string,
    @Body() createContributionDto: CreateContributionDto,
  ) {
    createContributionDto.challengeId = challengeId;
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.addContribution(createContributionDto, user);
  }

  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN])
  @Delete('challenges/:challengeId')
  async deleteChallenge(
    @Request() req,
    @Param('challengeId') challengeId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.deleteChallenge(challengeId, user);
  }

  // Calendar Events Endpoints
  @UseGuards(JwtAuthGuard)
  @Post(':groupId/calendar-events')
  async createCalendarEvent(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createCalendarEventDto: CreateCalendarEventDto,
  ) {
    createCalendarEventDto.groupId = groupId;
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createCalendarEvent(createCalendarEventDto, user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/calendar-events')
  async getGroupCalendarEvents(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.getGroupCalendarEvents(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('calendar-events/:eventId')
  async updateCalendarEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.updateCalendarEvent(eventId, updateCalendarEventDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('calendar-events/:eventId')
  async deleteCalendarEvent(
    @Request() req,
    @Param('eventId') eventId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.deleteCalendarEvent(eventId, user);
  }

  // Todo Items Endpoints
  @UseGuards(JwtAuthGuard)
  @Post(':groupId/todo-items')
  async createTodoItem(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() createTodoItemDto: CreateTodoItemDto,
  ) {
    createTodoItemDto.groupId = groupId;
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createTodoItem(createTodoItemDto, user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/todo-items')
  async getGroupTodoItems(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.getGroupTodoItems(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('todo-items/:todoId')
  async updateTodoItem(
    @Request() req,
    @Param('todoId') todoId: string,
    @Body() updateTodoItemDto: UpdateTodoItemDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.updateTodoItem(todoId, updateTodoItemDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('todo-items/:todoId')
  async deleteTodoItem(
    @Request() req,
    @Param('todoId') todoId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.deleteTodoItem(todoId, user);
  }

  // ModMail Endpoints
  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Post(':groupId/modmail')
  async createModmailConversation(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() dto: CreateModMailConversationDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.createModmailConversation(
      groupId,
      user,
      dto.subject,
      dto.recipientId,
      dto.initialMessage,
    );
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/modmail')
  async getModmailConversations(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.getModmailConversations(groupId, user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/modmail/:conversationId/messages')
  async getModmailMessages(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.getModmailMessages(groupId, conversationId, user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Post(':groupId/modmail/:conversationId/messages')
  async sendModmailMessage(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ModMailMessageDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.groupsService.sendModmailMessage(
      groupId,
      conversationId,
      user,
      dto.content,
      dto.isInternal ?? false,
    );
  }
}