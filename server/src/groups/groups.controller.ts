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

import { GroupPrivacyGuard } from './guards/group-privacy.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getGroups(@Request() req) {
    return this.groupsService.getGroups(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGroup(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(
      createGroupDto.name,
      req.user,
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
    return this.groupsService.createChannel(
      groupId,
      createChannelDto.name,
      req.user,
      createChannelDto.type,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('channels/:channelId/join')
  async joinChannel(@Request() req, @Param('channelId') channelId: string) {
    return this.groupsService.joinChannel(channelId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('channels/:channelId/leave')
  async leaveChannel(@Request() req, @Param('channelId') channelId: string) {
    return this.groupsService.leaveChannel(channelId, req.user.id);
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
    return this.groupsService.addMessage(
      channelId,
      sendMessageDto.content,
      req.user,
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
    return this.groupsService.createProposal(
      groupId,
      req.user,
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
    return this.groupsService.vote(proposalId, req.user, createVoteDto);
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
    return this.groupsService.createChallenge(createChallengeDto, req.user);
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
    return this.groupsService.updateChallenge(challengeId, updateChallengeDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('challenges/:challengeId/contributions')
  async addContribution(
    @Request() req,
    @Param('challengeId') challengeId: string,
    @Body() createContributionDto: CreateContributionDto,
  ) {
    createContributionDto.challengeId = challengeId;
    return this.groupsService.addContribution(createContributionDto, req.user);
  }

  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @SetMetadata('roles', [GroupRole.ADMIN])
  @Delete('challenges/:challengeId')
  async deleteChallenge(
    @Request() req,
    @Param('challengeId') challengeId: string,
  ) {
    return this.groupsService.deleteChallenge(challengeId, req.user);
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
    return this.groupsService.createCalendarEvent(createCalendarEventDto, req.user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/calendar-events')
  async getGroupCalendarEvents(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.getGroupCalendarEvents(groupId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('calendar-events/:eventId')
  async updateCalendarEvent(
    @Request() req,
    @Param('eventId') eventId: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
  ) {
    return this.groupsService.updateCalendarEvent(eventId, updateCalendarEventDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('calendar-events/:eventId')
  async deleteCalendarEvent(
    @Request() req,
    @Param('eventId') eventId: string,
  ) {
    return this.groupsService.deleteCalendarEvent(eventId, req.user);
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
    return this.groupsService.createTodoItem(createTodoItemDto, req.user);
  }

  @UseGuards(JwtAuthGuard, GroupPrivacyGuard)
  @Get(':groupId/todo-items')
  async getGroupTodoItems(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.getGroupTodoItems(groupId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('todo-items/:todoId')
  async updateTodoItem(
    @Request() req,
    @Param('todoId') todoId: string,
    @Body() updateTodoItemDto: UpdateTodoItemDto,
  ) {
    return this.groupsService.updateTodoItem(todoId, updateTodoItemDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('todo-items/:todoId')
  async deleteTodoItem(
    @Request() req,
    @Param('todoId') todoId: string,
  ) {
    return this.groupsService.deleteTodoItem(todoId, req.user);
  }
}