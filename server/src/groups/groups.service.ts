import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupPrivacy } from './enums/group-privacy.enum';
import { Channel, ChannelMember } from './entities/channel.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Message } from '../dms/entities/message.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupRole } from './group-role.enum';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { TokenGatedContentService } from '../token-gated-content/token-gated-content.service';
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEvent } from '../reputation/reputation.enum';
import { VotingSystem } from './voting-system.enum';
import { ChannelsGateway } from './channels.gateway';
// Community challenges imports
import { CommunityChallenge } from './entities/community-challenge.entity';
import { ChallengeContribution } from './entities/challenge-contribution.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { ChallengeStatus } from './enums/challenge-status.enum';
import { ContributionType } from './enums/contribution-type.enum';
// Calendar and Todo imports
import { CalendarEvent } from './entities/calendar-event.entity';
import { TodoItem } from './entities/todo-item.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateTodoItemDto } from './dto/update-todo-item.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMembersRepository: Repository<ChannelMember>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
    @InjectRepository(CommunityChallenge)
    private readonly challengesRepository: Repository<CommunityChallenge>,
    @InjectRepository(ChallengeContribution)
    private readonly contributionsRepository: Repository<ChallengeContribution>,
    @InjectRepository(CalendarEvent)
    private readonly calendarEventsRepository: Repository<CalendarEvent>,
    @InjectRepository(TodoItem)
    private readonly todoItemsRepository: Repository<TodoItem>,
    private readonly usersService: UsersService,
    private readonly tokenGatedContentService: TokenGatedContentService,
    private readonly reputationService: ReputationService,
    private readonly channelsGateway: ChannelsGateway,
  ) {}

  async createGroup(
    name: string,
    owner: User,
    privacy: GroupPrivacy,
    isDao?: boolean,
    votingSystem?: VotingSystem,
    tokenGated?: boolean,
    contractAddress?: string,
    requiredTokenBalance?: string,
    allowAnonymousPosting?: boolean,
  ): Promise<Group> {
    const group = this.groupsRepository.create({
      name,
      owner,
      privacy,
      isDao,
      votingSystem,
      tokenGated,
      contractAddress,
      requiredTokenBalance,
      allowAnonymousPosting,
    });
    await this.groupsRepository.save(group);

    const ownerMembership = this.groupMembersRepository.create({
      group,
      user: owner,
      role: GroupRole.ADMIN,
    });
    await this.groupMembersRepository.save(ownerMembership);

    return group;
  }

  async getGroupById(groupId: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async isMember(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.groupMembersRepository.findOne({
      where: { user: { id: userId }, group: { id: groupId } },
    });
    return !!membership;
  }

  async getGroups(user: User): Promise<Group[]> {
    const groupMemberships = await this.groupMembersRepository.find({
      where: { user: { id: user.id } },
      relations: ['group'],
    });
    return groupMemberships.map((gm) => gm.group);
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMembersRepository.find({
      where: { group: { id: groupId } },
      relations: ['user'],
    });
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    role: GroupRole,
  ): Promise<GroupMember> {
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!membership) {
      throw new NotFoundException('Group member not found');
    }
    membership.role = role;
    return this.groupMembersRepository.save(membership);
  }

  async getChannels(groupId: string): Promise<Channel[]> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: ['channels'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group.channels;
  }

  async createChannel(
    groupId: string,
    name: string,
    user: User,
    type: 'group' | 'broadcast' = 'group',
  ): Promise<Channel> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.owner.id !== user.id) {
      throw new NotFoundException('Only group owner can create channels');
    }
    const channel = this.channelsRepository.create({ name, group, type });
    await this.channelsRepository.save(channel);

    if (type === 'broadcast') {
      const admin = this.channelMembersRepository.create({
        channel,
        user,
        role: 'admin',
      });
      await this.channelMembersRepository.save(admin);
    }

    return channel;
  }

  async joinChannel(channelId: string, user: User): Promise<ChannelMember> {
    const channel = await this.channelsRepository.findOne({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const existingMember = await this.channelMembersRepository.findOne({
      where: { channel: { id: channelId }, user: { id: user.id } },
    });

    if (existingMember) {
      return existingMember;
    }

    const member = this.channelMembersRepository.create({
      channel,
      user,
      role: 'member',
    });

    return this.channelMembersRepository.save(member);
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const member = await this.channelMembersRepository.findOne({
      where: { channel: { id: channelId }, user: { id: userId } },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this channel');
    }

    await this.channelMembersRepository.remove(member);
  }

  async addMessage(
    channelId: string,
    content: string,
    sender: User,
  ): Promise<Message> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type === 'broadcast') {
      const member = await this.channelMembersRepository.findOne({
        where: { channel: { id: channelId }, user: { id: sender.id } },
      });
      if (!member || member.role !== 'admin') {
        throw new UnauthorizedException(
          'You do not have permission to send messages in this channel',
        );
      }
    }

    const message = new Message();
    message.content = content;
    message.sender = sender;
    message.channel = channel;

    const savedMessage = await this.messagesRepository.save(message);

    this.channelsGateway.sendMessageToChannel(channelId, savedMessage);

    return savedMessage;
  }

  async getMessages(channelId: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { channel: { id: channelId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async createProposal(
    groupId: string,
    creator: User,
    createProposalDto: CreateProposalDto,
  ): Promise<Proposal> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.isDao) {
      throw new UnauthorizedException('This group is not a DAO');
    }
    const proposal = this.proposalsRepository.create({
      ...createProposalDto,
      group,
      creator,
    });
    await this.reputationService.addReputation(ReputationEvent.PROPOSAL_CREATED, creator);
    return this.proposalsRepository.save(proposal);
  }

  async getProposals(groupId: string): Promise<Proposal[]> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId }, relations: ['proposals'] });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group.proposals;
  }

  async vote(
    proposalId: string,
    voter: User,
    createVoteDto: CreateVoteDto,
  ): Promise<Vote> {
    const proposal = await this.proposalsRepository.findOne({ where: { id: proposalId }, relations: ['group'] });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.status !== ProposalStatus.ACTIVE) {
      throw new UnauthorizedException('This proposal is not active');
    }
    const member = await this.groupMembersRepository.findOne({ where: { group: { id: proposal.group.id }, user: { id: voter.id } } });
    if (!member) {
      throw new UnauthorizedException('You are not a member of this group');
    }
    const existingVote = await this.votesRepository.findOne({ where: { proposal: { id: proposalId }, voter: { id: voter.id } } });
    if (existingVote) {
      throw new UnauthorizedException('You have already voted on this proposal');
    }

    let voteWeight = 1;
    if (proposal.group.votingSystem === VotingSystem.TOKEN_WEIGHTED) {
      const balance = await this.tokenGatedContentService.checkTokenBalance(
        voter.walletAddress,
        proposal.group.contractAddress,
      );
      voteWeight = Number(balance);
    } else if (proposal.group.votingSystem === VotingSystem.NFT_GATED) {
      const balance = await this.tokenGatedContentService.checkTokenBalance(
        voter.walletAddress,
        proposal.group.contractAddress,
      );
      if (balance === BigInt(0)) {
        throw new UnauthorizedException('You do not own the required NFT to vote');
      }
    }

    const vote = this.votesRepository.create({
      ...createVoteDto,
      proposal,
      voter,
      weight: voteWeight,
    });
    await this.reputationService.addReputation(ReputationEvent.VOTE_CAST, voter);
    return this.votesRepository.save(vote);
  }

  // Community Challenges & Campaigns Methods
  async createChallenge(createChallengeDto: CreateChallengeDto, creator: User): Promise<CommunityChallenge> {
    const group = await this.groupsRepository.findOne({
      where: { id: createChallengeDto.groupId },
      relations: ['owner'],
    });
    
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is group owner or admin
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: group.id }, user: { id: creator.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && group.owner.id !== creator.id)) {
      throw new ForbiddenException('Only group admins can create challenges');
    }

    // Initialize current metrics
    const currentAmount = createChallengeDto.goalAmount ? 0 : undefined;
    const currentParticipantCount = createChallengeDto.goalParticipantCount ? 0 : undefined;
    const currentActionCount = createChallengeDto.goalActionCount ? 0 : undefined;

    const challenge = this.challengesRepository.create({
      ...createChallengeDto,
      group,
      creator,
      currentAmount,
      currentParticipantCount,
      currentActionCount,
    });

    return this.challengesRepository.save(challenge);
  }

  async getGroupChallenges(groupId: string): Promise<CommunityChallenge[]> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.challengesRepository.find({
      where: { group: { id: groupId } },
      relations: ['creator', 'contributions', 'contributions.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getChallenge(challengeId: string): Promise<CommunityChallenge> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
      relations: ['creator', 'contributions', 'contributions.user', 'group'],
    });
    
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }
    return challenge;
  }

  async updateChallenge(challengeId: string, updateChallengeDto: UpdateChallengeDto, updater: User): Promise<CommunityChallenge> {
    const challenge = await this.getChallenge(challengeId);
    
    // Check if user is authorized to update
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: challenge.group.id }, user: { id: updater.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && challenge.creator.id !== updater.id)) {
      throw new ForbiddenException('Only group admins or the challenge creator can update this challenge');
    }

    const updatedChallenge = this.challengesRepository.merge(challenge, updateChallengeDto);
    
    // Auto-mark as completed if goals are reached
    if (
      (challenge.goalAmount && updatedChallenge.currentAmount >= challenge.goalAmount) ||
      (challenge.goalParticipantCount && updatedChallenge.currentParticipantCount >= challenge.goalParticipantCount) ||
      (challenge.goalActionCount && updatedChallenge.currentActionCount >= challenge.goalActionCount)
    ) {
      updatedChallenge.status = ChallengeStatus.COMPLETED;
    }

    return this.challengesRepository.save(updatedChallenge);
  }

  async addContribution(createContributionDto: CreateContributionDto, contributor: User): Promise<ChallengeContribution> {
    const challenge = await this.getChallenge(createContributionDto.challengeId);
    
    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new UnauthorizedException('Cannot contribute to an inactive challenge');
    }

    // Check if user is a group member
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: challenge.group.id }, user: { id: contributor.id } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Only group members can contribute to challenges');
    }

    // Check for duplicate participation contributions
    if (createContributionDto.type === ContributionType.PARTICIPATION) {
      const existingParticipation = await this.contributionsRepository.findOne({
        where: { challenge: { id: challenge.id }, user: { id: contributor.id }, type: ContributionType.PARTICIPATION },
      });
      if (existingParticipation) {
        throw new UnauthorizedException('You have already participated in this challenge');
      }
    }

    const contribution = this.contributionsRepository.create({
      ...createContributionDto,
      challenge,
      user: contributor,
    });

    const savedContribution = await this.contributionsRepository.save(contribution);

    // Update challenge metrics based on contribution type
    const updates: Partial<CommunityChallenge> = {};
    
    if (createContributionDto.type === ContributionType.MONETARY || createContributionDto.type === ContributionType.DONATION) {
      if (createContributionDto.amount && challenge.currentAmount !== undefined) {
        updates.currentAmount = challenge.currentAmount + createContributionDto.amount;
      }
    } else if (createContributionDto.type === ContributionType.PARTICIPATION) {
      if (challenge.currentParticipantCount !== undefined) {
        updates.currentParticipantCount = challenge.currentParticipantCount + 1;
      }
    } else if (createContributionDto.type === ContributionType.ACTION) {
      if (challenge.currentActionCount !== undefined) {
        updates.currentActionCount = challenge.currentActionCount + 1;
      }
    }

    // Check if we need to mark the challenge as completed
    if (Object.keys(updates).length > 0) {
      const updatedChallenge = await this.updateChallenge(challenge.id, updates, contributor);
      (savedContribution as any).challenge = updatedChallenge;
    }

    return savedContribution;
  }

  async deleteChallenge(challengeId: string, deleter: User): Promise<void> {
    const challenge = await this.getChallenge(challengeId);
    
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: challenge.group.id }, user: { id: deleter.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && challenge.creator.id !== deleter.id)) {
      throw new ForbiddenException('Only group admins or the challenge creator can delete this challenge');
    }

    // Delete all contributions first
    await this.contributionsRepository.delete({ challenge: { id: challengeId } });
    await this.challengesRepository.remove(challenge);
  }

  // Calendar Event Methods
  async createCalendarEvent(createCalendarEventDto: any, creator: User): Promise<any> {
    const { groupId, ...eventData } = createCalendarEventDto;
    const group = await this.getGroupById(groupId);
    
    // Check if user is a group member
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: creator.id } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Only group members can create calendar events');
    }

    const event = this.calendarEventsRepository.create({
      ...eventData,
      group,
      creator,
    });

    return this.calendarEventsRepository.save(event);
  }

  async getGroupCalendarEvents(groupId: string, user: User): Promise<any[]> {
    const group = await this.getGroupById(groupId);
    
    // Check if user is a group member
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Only group members can view calendar events');
    }

    return this.calendarEventsRepository.find({
      where: { group: { id: groupId } },
      relations: ['creator'],
      order: { startTime: 'ASC' },
    });
  }

  async updateCalendarEvent(eventId: string, updateCalendarEventDto: any, updater: User): Promise<any> {
    const event = await this.calendarEventsRepository.findOne({
      where: { id: eventId },
      relations: ['group'],
    });
    
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Check if user is a group admin or the event creator
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: event.group.id }, user: { id: updater.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && event.creator.id !== updater.id)) {
      throw new ForbiddenException('Only group admins or the event creator can update this event');
    }

    const updatedEvent = this.calendarEventsRepository.merge(event, updateCalendarEventDto);
    return this.calendarEventsRepository.save(updatedEvent);
  }

  async deleteCalendarEvent(eventId: string, deleter: User): Promise<void> {
    const event = await this.calendarEventsRepository.findOne({
      where: { id: eventId },
      relations: ['group'],
    });
    
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    // Check if user is a group admin or the event creator
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: event.group.id }, user: { id: deleter.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && event.creator.id !== deleter.id)) {
      throw new ForbiddenException('Only group admins or the event creator can delete this event');
    }

    await this.calendarEventsRepository.remove(event);
  }

  // Todo Item Methods
  async createTodoItem(createTodoItemDto: any, creator: User): Promise<any> {
    const { groupId, assigneeId, ...todoData } = createTodoItemDto;
    const group = await this.getGroupById(groupId);
    
    // Check if user is a group member
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: creator.id } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Only group members can create todo items');
    }

    const todo = this.todoItemsRepository.create({
      ...todoData,
      group,
      creator,
    });

    // If assignee is provided, add it
    if (assigneeId) {
      const assignee = await this.usersService.getUserById(assigneeId);
      todo.assignee = assignee;
    }

    return this.todoItemsRepository.save(todo);
  }

  async getGroupTodoItems(groupId: string, user: User): Promise<any[]> {
    const group = await this.getGroupById(groupId);
    
    // Check if user is a group member
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Only group members can view todo items');
    }

    return this.todoItemsRepository.find({
      where: { group: { id: groupId } },
      relations: ['creator', 'assignee'],
      order: { dueDate: 'ASC', completed: 'ASC' },
    });
  }

  async updateTodoItem(todoId: string, updateTodoItemDto: any, updater: User): Promise<any> {
    const todo = await this.todoItemsRepository.findOne({
      where: { id: todoId },
      relations: ['group'],
    });
    
    if (!todo) {
      throw new NotFoundException('Todo item not found');
    }

    // Check if user is a group admin, the todo creator, or the assignee
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: todo.group.id }, user: { id: updater.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && todo.creator.id !== updater.id && todo.assignee?.id !== updater.id)) {
      throw new ForbiddenException('Only group admins, the todo creator, or the assignee can update this item');
    }

    const { assigneeId, ...updateData } = updateTodoItemDto;
    const updatedTodo = this.todoItemsRepository.merge(todo, updateData);

    // If assignee is being updated
    if (assigneeId) {
      const assignee = await this.usersService.getUserById(assigneeId);
      updatedTodo.assignee = assignee;
    }

    return this.todoItemsRepository.save(updatedTodo);
  }

  async deleteTodoItem(todoId: string, deleter: User): Promise<void> {
    const todo = await this.todoItemsRepository.findOne({
      where: { id: todoId },
      relations: ['group'],
    });
    
    if (!todo) {
      throw new NotFoundException('Todo item not found');
    }

    // Check if user is a group admin or the todo creator
    const membership = await this.groupMembersRepository.findOne({
      where: { group: { id: todo.group.id }, user: { id: deleter.id } },
    });
    
    if (!membership || (membership.role !== GroupRole.ADMIN && todo.creator.id !== deleter.id)) {
      throw new ForbiddenException('Only group admins or the todo creator can delete this item');
    }

    await this.todoItemsRepository.remove(todo);
  }
}