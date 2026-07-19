import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Not, Repository } from 'typeorm';
import { webcrypto } from 'crypto';
import { User, ProfilePrivacy } from './entities/user.entity';
import { FollowRequest } from './entities/follow-request.entity';
import { Poke } from './entities/poke.entity';
import { Post } from '../posts/entities/post.entity';
import { Role } from './roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StorageService } from '../storage/storage.service';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { LifeEvent } from './entities/life-event.entity';
import { CreateLifeEventDto } from './dto/create-life-event.dto';
import { UpdateLifeEventDto } from './dto/update-life-event.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateFaceRecognitionDto } from './dto/update-face-recognition.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
    @InjectRepository(Poke)
    private readonly pokeRepository: Repository<Poke>,
    @InjectRepository(LifeEvent)
    private readonly lifeEventRepository: Repository<LifeEvent>,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
  ) {}

  async updateFaceRecognition(
    userId: string,
    updateFaceRecognitionDto: UpdateFaceRecognitionDto,
  ): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In a real application, you'd have a service to determine this based on user's country
    const isRegionEligible = true; 

    if (!isRegionEligible) {
      throw new ForbiddenException(
        'Face recognition is not available in your region.',
      );
    }

    user.isFaceRecognitionEnabled =
      updateFaceRecognitionDto.isFaceRecognitionEnabled;
    user.isRegionEligibleForFaceRecognition = isRegionEligible;

    return this.usersRepository.save(user);
  }

  async updateAvatar(userId: string, file: any): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${userId}-${Date.now()}-${file.originalname}`;
    const filePath = join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(filePath);
      stream.on('finish', async () => {
        const avatarUrl = `/uploads/avatars/${fileName}`;
        user.avatar = avatarUrl;
        await this.usersRepository.save(user);
        resolve(user);
      });
      stream.on('error', (error) => {
        reject(error);
      });
      stream.write(file.buffer);
      stream.end();
    });
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
    avatar: any,
  ): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already exists');
      }
    }

    if (avatar) {
      const avatarUrl = await this.storageService.upload(avatar.buffer);
      user.avatar = avatarUrl;
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.profileTheme) {
      user.profileTheme = updateUserDto.profileTheme;
    }
    if (updateUserDto.profileThemeColor) {
      user.profileThemeColor = updateUserDto.profileThemeColor;
    }
    if (updateUserDto.profileBioFont) {
      user.profileBioFont = updateUserDto.profileBioFont;
    }

    return this.usersRepository.save(user);
  }

  async updatePrivacy(userId: string, updatePrivacyDto: UpdatePrivacyDto): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updatePrivacyDto.postVisibility) {
      user.postVisibility = updatePrivacyDto.postVisibility;
    }

    if (updatePrivacyDto.friendRequestPrivacy) {
      user.friendRequestPrivacy = updatePrivacyDto.friendRequestPrivacy;
    }

    if (updatePrivacyDto.emailSearchPrivacy) {
      user.emailSearchPrivacy = updatePrivacyDto.emailSearchPrivacy;
    }

    if (updatePrivacyDto.commentPrivacy) {
      user.commentPrivacy = updatePrivacyDto.commentPrivacy;
    }

    if (updatePrivacyDto.tagPrivacy) {
      user.tagPrivacy = updatePrivacyDto.tagPrivacy;
    }

    if (updatePrivacyDto.messagePrivacy) {
      user.messagePrivacy = updatePrivacyDto.messagePrivacy;
    }

    if (updatePrivacyDto.screenshotProtection) {
      user.screenshotProtection = {
        ...user.screenshotProtection,
        ...updatePrivacyDto.screenshotProtection,
      } as any;
    }

    return this.usersRepository.save(user);
  }

  async findOneById(
    id: string,
    relations: string[] = [],
  ): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id }, relations });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string, relations: string[] = [], _requestingUserId?: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username }, relations });
  }

  async findByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { walletAddress } });
  }

  async findByEmailVerificationToken(token: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      passwordResetToken: token,
      passwordResetTokenExpires: expires,
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });
  }

  async findOrCreate(provider: string, providerId: string, email: string): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { provider, providerId } });
    if (!user) {
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        user.provider = provider;
        user.providerId = providerId;
      } else {
        user = this.usersRepository.create({ email, provider, providerId });
      }
      await this.usersRepository.save(user);
    }
    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username) {
      const existingUser = await this.usersRepository.findOne({ where: { username: updateUserDto.username } });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(updateUserDto).filter(([, value]) => value !== undefined),
    );

    if (updateUserDto.avatarUrl) {
      updateData.avatar = updateUserDto.avatarUrl;
    }

    if (updateUserDto.profileHeaderImageUrl) {
      updateData.profileHeaderImageUrl = updateUserDto.profileHeaderImageUrl;
      updateData.header = updateUserDto.profileHeaderImageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async deactivate(userId: string): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = 'deactivated' as any;
    return this.usersRepository.save(user);
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (await this.isBlockedBy(followerId, followingId)) {
      throw new ForbiddenException('You are blocked by this user.');
    }
    if (await this.isBlockedBy(followingId, followerId)) {
      throw new ForbiddenException('You cannot follow a user you have blocked.');
    }

    const follower = await this.usersRepository.findOne({
      where: { id: followerId },
      relations: ['following'],
    });
    const following = await this.usersRepository.findOne({
      where: { id: followingId },
    });

    if (!follower || !following) {
      throw new NotFoundException('User not found.');
    }

    if (follower.following.some((user) => user.id === followingId)) {
      return;
    }

    follower.following.push(following);
    await this.usersRepository.save(follower);

    await this.notificationsService.createNotification(
      following,
      NotificationType.FOLLOW,
      { followerId: follower.id, followerUsername: follower.username }
    );
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follower = await this.usersRepository.findOne({
      where: { id: followerId },
      relations: ['following'],
    });

    if (!follower) {
      throw new NotFoundException('Follower not found.');
    }

    if (!follower.following.some((user) => user.id === followingId)) {
      return;
    }

    follower.following = follower.following.filter(
      (user) => user.id !== followingId,
    );
    await this.usersRepository.save(follower);
  }

  async addFavorite(userId: string, favoriteUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });
    const favoriteUser = await this.usersRepository.findOne({
      where: { id: favoriteUserId },
    });

    if (!user || !favoriteUser) {
      throw new NotFoundException('User not found.');
    }

    if (user.favorites.some((user) => user.id === favoriteUserId)) {
      return;
    }

    user.favorites.push(favoriteUser);
    await this.usersRepository.save(user);
  }

  async removeFavorite(userId: string, favoriteUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.favorites.some((user) => user.id === favoriteUserId)) {
      return;
    }

    user.favorites = user.favorites.filter(
      (user) => user.id !== favoriteUserId,
    );
    await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOneWithPosts(
    id: string,
    currentUserId?: string,
    take = 10,
    skip = 0,
  ): Promise<User | undefined> {
    if (currentUserId && (await this.isBlockedBy(id, currentUserId))) {
      throw new ForbiddenException('This user has blocked you.');
    }

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['followers'],
    });

    if (!user) {
      return undefined;
    }

    if (user.profilePrivacy === ProfilePrivacy.PRIVATE) {
      if (!currentUserId || !user.followers.some((follower) => follower.id === currentUserId)) {
        throw new ForbiddenException('This profile is private.');
      }
    }

    const posts = await this.postsRepository.find({
      where: { user: { id } },
      order: { createdAt: 'DESC' },
      take,
      skip,
      relations: ['user', 'likes', 'likes.user'],
    });

    user.posts = posts;

    return user;
  }

  async findByUsernames(usernames: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        username: In(usernames),
      },
    });
  }

  async findMultipleByIds(ids: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async search(query: string, searchingUserId?: string): Promise<User[]> {
    const users = await this.usersRepository.find({
      where: [
        { username: Like(`%${query}%`) },
        { displayName: Like(`%${query}%`) },
      ],
      take: 10,
    });

    if (query.includes('@')) {
      const emailUsers = await this.usersRepository.find({
        where: { email: Like(`%${query}%`) },
        relations: ['followers'],
      });

      const searchingUser = searchingUserId
        ? await this.findOneById(searchingUserId, ['following'])
        : null;

      const filteredEmailUsers = emailUsers.filter((user) => {
        if (user.emailSearchPrivacy === 'everyone') {
          return true;
        }
        if (user.emailSearchPrivacy === 'friends' && searchingUser) {
          return user.followers.some(
            (follower) => follower.id === searchingUser.id,
          );
        }
        return false;
      });

      users.push(...filteredEmailUsers);
    }

    return users;
  }

  async findOrCreatePlatformUser(): Promise<User> {
    const platformEmail = 'platform@zynkra.com';
    let platformUser = await this.findByEmail(platformEmail);

    if (!platformUser) {
      platformUser = await this.createUser({
        email: platformEmail,
        role: Role.ADMIN,
      });
    }

    return platformUser;
  }

  async findMutualFollows(userId1: string, userId2: string): Promise<User[]> {
    const user1 = await this.usersRepository.findOne({
      where: { id: userId1 },
      relations: ['following'],
    });
    const user2 = await this.usersRepository.findOne({
      where: { id: userId2 },
      relations: ['following'],
    });

    if (!user1 || !user2) {
      throw new NotFoundException('User not found.');
    }

    const following1 = user1.following.map((user) => user.id);
    const mutuals = user2.following.filter((user) =>
      following1.includes(user.id),
    );

    return mutuals;
  }

  async ban(user: User): Promise<User> {
    user.banned = true;
    return this.usersRepository.save(user);
  }

  async restrict(userId: string, restrictedUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['restrictedUsers'],
    });
    const userToRestrict = await this.usersRepository.findOneBy({
      id: restrictedUserId,
    });

    if (!user || !userToRestrict) {
      throw new NotFoundException('User not found');
    }

    if (user.id === restrictedUserId) {
      throw new BadRequestException('You cannot restrict yourself.');
    }

    const isAlreadyRestricted = user.restrictedUsers.some(
      (u) => u.id === restrictedUserId,
    );
    if (isAlreadyRestricted) {
      throw new BadRequestException('User is already restricted.');
    }

    user.restrictedUsers.push(userToRestrict);
    await this.usersRepository.save(user);
  }

  async unrestrict(userId: string, restrictedUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['restrictedUsers'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isRestricted = user.restrictedUsers.some(
      (u) => u.id === restrictedUserId,
    );
    if (!isRestricted) {
      throw new BadRequestException('User is not restricted.');
    }

    user.restrictedUsers = user.restrictedUsers.filter(
      (u) => u.id !== restrictedUserId,
    );
    await this.usersRepository.save(user);
  }

  async getRestrictedUsers(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['restrictedUsers'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.restrictedUsers;
  }

  async block(userId: string, blockedUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers', 'following', 'followers'],
    });
    const userToBlock = await this.usersRepository.findOneBy({
      id: blockedUserId,
    });

    if (!user || !userToBlock) {
      throw new NotFoundException('User not found');
    }

    if (user.id === blockedUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    const isAlreadyBlocked = user.blockedUsers.some(
      (u) => u.id === blockedUserId,
    );
    if (isAlreadyBlocked) {
      throw new BadRequestException('User is already blocked.');
    }

    // Remove relationships: following, followers
    user.following = user.following.filter((u) => u.id !== blockedUserId);
    user.followers = user.followers.filter((u) => u.id !== blockedUserId);

    user.blockedUsers.push(userToBlock);
    await this.usersRepository.save(user);
  }

  async unblock(userId: string, blockedUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isBlocked = user.blockedUsers.some((u) => u.id === blockedUserId);
    if (!isBlocked) {
      throw new BadRequestException('User is not blocked.');
    }

    user.blockedUsers = user.blockedUsers.filter(
      (u) => u.id !== blockedUserId,
    );
    await this.usersRepository.save(user);
  }

  async followHashtag(userId: string, hashtagName: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.followedHashtags = user.followedHashtags || [];
    if (user.followedHashtags.some((ht) => ht.name === hashtagName)) {
      return; // Already following
    }

    // Generate a unique ID for the hashtag
    const newHashtag = {
      id: webcrypto.randomUUID(),
      name: hashtagName.toLowerCase(),
    };
    user.followedHashtags.push(newHashtag);
    await this.usersRepository.save(user);
  }

  async unfollowHashtag(userId: string, hashtagName: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.followedHashtags = user.followedHashtags || [];
    const isFollowing = user.followedHashtags.some((ht) => ht.name === hashtagName.toLowerCase());
    if (!isFollowing) {
      throw new BadRequestException('Hashtag is not being followed');
    }

    user.followedHashtags = user.followedHashtags.filter(
      (ht) => ht.name !== hashtagName.toLowerCase(),
    );
    await this.usersRepository.save(user);
  }

  async blockKeyword(userId: string, keyword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedKeywords = user.blockedKeywords || [];
    if (user.blockedKeywords.includes(keyword.toLowerCase())) {
      return; // Already blocked
    }

    user.blockedKeywords.push(keyword.toLowerCase());
    await this.usersRepository.save(user);
  }

  async unblockKeyword(userId: string, keyword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedKeywords = user.blockedKeywords || [];
    const isBlocked = user.blockedKeywords.includes(keyword.toLowerCase());
    if (!isBlocked) {
      throw new BadRequestException('Keyword is not blocked');
    }

    user.blockedKeywords = user.blockedKeywords.filter(
      (k) => k !== keyword.toLowerCase(),
    );
    await this.usersRepository.save(user);
  }

  async blockHashtag(userId: string, hashtagName: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedHashtags = user.blockedHashtags || [];
    if (user.blockedHashtags.includes(hashtagName.toLowerCase())) {
      return; // Already blocked
    }

    user.blockedHashtags.push(hashtagName.toLowerCase());
    await this.usersRepository.save(user);
  }

  async unblockHashtag(userId: string, hashtagName: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedHashtags = user.blockedHashtags || [];
    const isBlocked = user.blockedHashtags.includes(hashtagName.toLowerCase());
    if (!isBlocked) {
      throw new BadRequestException('Hashtag is not blocked');
    }

    user.blockedHashtags = user.blockedHashtags.filter(
      (ht) => ht !== hashtagName.toLowerCase(),
    );
    await this.usersRepository.save(user);
  }

  async blockContentType(userId: string, contentType: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedContentTypes = user.blockedContentTypes || [];
    if (user.blockedContentTypes.includes(contentType.toLowerCase())) {
      return; // Already blocked
    }

    user.blockedContentTypes.push(contentType.toLowerCase());
    await this.usersRepository.save(user);
  }

  async unblockContentType(userId: string, contentType: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blockedContentTypes = user.blockedContentTypes || [];
    const isBlocked = user.blockedContentTypes.includes(contentType.toLowerCase());
    if (!isBlocked) {
      throw new BadRequestException('Content type is not blocked');
    }

    user.blockedContentTypes = user.blockedContentTypes.filter(
      (ct) => ct !== contentType.toLowerCase(),
    );
    await this.usersRepository.save(user);
  }

  async getBlockedKeywords(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.blockedKeywords || [];
  }

  async getBlockedHashtags(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.blockedHashtags || [];
  }

  async getBlockedContentTypes(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.blockedContentTypes || [];
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.blockedUsers;
  }

  async isBlockedBy(userId: string, byUserId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: byUserId },
      relations: ['blockedUsers'],
    });
    return user?.blockedUsers.some((u) => u.id === userId) || false;
  }

  async createFollowRequest(requesterId: string, recipientId: string): Promise<void> {
    const requester = await this.usersRepository.findOne({ where: { id: requesterId } });
    const recipient = await this.usersRepository.findOne({ where: { id: recipientId } });

    if (!requester || !recipient) {
      throw new NotFoundException('User not found.');
    }

    if (recipient.profilePrivacy === ProfilePrivacy.PUBLIC) {
      await this.follow(requesterId, recipientId);
      return;
    }

    const existingRequest = await this.followRequestRepository.findOne({
      where: { requester: { id: requesterId }, recipient: { id: recipientId } },
    });

    if (existingRequest) {
      return;
    }

    const followRequest = this.followRequestRepository.create({
      requester,
      recipient,
    });

    await this.followRequestRepository.save(followRequest);
  }

  async acceptFollowRequest(recipientId: string, followRequestId: string): Promise<void> {
    const followRequest = await this.followRequestRepository.findOne({
      where: { id: followRequestId },
      relations: ['requester', 'recipient'],
    });

    if (!followRequest || followRequest.recipient.id !== recipientId) {
      throw new NotFoundException('Follow request not found.');
    }

    await this.follow(followRequest.requester.id, followRequest.recipient.id);
    await this.followRequestRepository.delete(followRequestId);
  }

  async denyFollowRequest(recipientId: string, followRequestId: string): Promise<void> {
    const followRequest = await this.followRequestRepository.findOne({
      where: { id: followRequestId, recipient: { id: recipientId } },
    });

    if (!followRequest) {
      throw new NotFoundException('Follow request not found.');
    }

    await this.followRequestRepository.delete(followRequestId);
  }

  async findFollowingIds(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user.following.map((f) => f.id);
  }

  async findFollowSuggestions(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const followingIds = user.following.map((f) => f.id);
    const excludedIds = [...followingIds, userId]; // Don't suggest the user themselves

    // Friends-of-friends: users followed by people the user follows, ranked by
    // how many of the user's follows also follow them (mutual count).
    let suggestions: User[] = [];
    if (followingIds.length > 0) {
      const rows: { id: string }[] = await this.usersRepository
        .createQueryBuilder('candidate')
        .select('candidate.id', 'id')
        .innerJoin('follows', 'f', 'f."followingId" = candidate.id')
        .where('f."followerId" IN (:...followingIds)', { followingIds })
        .andWhere('candidate.id NOT IN (:...excludedIds)', { excludedIds })
        .andWhere('candidate.profilePrivacy = :privacy', { privacy: ProfilePrivacy.PUBLIC })
        .groupBy('candidate.id')
        .orderBy('COUNT(f."followerId")', 'DESC')
        .limit(10)
        .getRawMany();

      if (rows.length > 0) {
        const ordered = rows.map((r) => r.id);
        const found = await this.usersRepository.find({ where: { id: In(ordered) } });
        suggestions = ordered
          .map((id) => found.find((u) => u.id === id))
          .filter((u): u is User => !!u);
      }
    }

    // Fall back to (or top up with) recently joined public accounts.
    if (suggestions.length < 10) {
      const fill = await this.usersRepository.find({
        where: {
          id: Not(In([...excludedIds, ...suggestions.map((s) => s.id)])),
          profilePrivacy: ProfilePrivacy.PUBLIC,
        },
        take: 10 - suggestions.length,
        order: {
          createdAt: 'DESC',
        },
      });
      suggestions = [...suggestions, ...fill];
    }

    // Never expose credentials in suggestion payloads.
    for (const s of suggestions) {
      (s as any).password_hash = undefined;
    }

    return suggestions;
  }

  async getCloseFriends(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['closeFriends'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.closeFriends;
  }

  async updateCloseFriends(
    userId: string,
    closeFriendIds: string[],
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['closeFriends'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const closeFriends = await this.usersRepository.find({
      where: { id: In(closeFriendIds) },
    });

    user.closeFriends = closeFriends;
    return this.usersRepository.save(user);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.followers;
  }

  async updateNotificationSettings(userId: string, settings: NotificationSettingsDto): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings,
    };

    return this.usersRepository.save(user);
  }

  async addLifeEvent(userId: string, createLifeEventDto: CreateLifeEventDto): Promise<LifeEvent> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const lifeEvent = this.lifeEventRepository.create({
      ...createLifeEventDto,
      user,
    });
    return this.lifeEventRepository.save(lifeEvent);
  }

  async updateLifeEvent(lifeEventId: string, updateLifeEventDto: UpdateLifeEventDto): Promise<LifeEvent> {
    const lifeEvent = await this.lifeEventRepository.findOneBy({ id: lifeEventId });
    if (!lifeEvent) {
      throw new NotFoundException('Life event not found');
    }
    Object.assign(lifeEvent, updateLifeEventDto);
    return this.lifeEventRepository.save(lifeEvent);
  }

  async removeLifeEvent(lifeEventId: string): Promise<void> {
    const result = await this.lifeEventRepository.delete(lifeEventId);
    if (result.affected === 0) {
      throw new NotFoundException('Life event not found');
    }
  }

  async pokeUser(senderId: string, receiverId: string): Promise<Poke> {
    const sender = await this.findOneById(senderId);
    const receiver = await this.findOneById(receiverId);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('You cannot poke yourself');
    }

    // Check if sender is blocked by receiver
    if (await this.isBlockedBy(senderId, receiverId)) {
      throw new ForbiddenException('You cannot poke this user');
    }

    // Check if there's an unreturned poke from receiver to sender, if so mark it as returned
    const existingUnreturnedPoke = await this.pokeRepository.findOne({
      where: { sender: { id: receiverId }, receiver: { id: senderId }, isReturned: false }
    });

    if (existingUnreturnedPoke) {
      existingUnreturnedPoke.isReturned = true;
      await this.pokeRepository.save(existingUnreturnedPoke);
    }

    // Create new poke
    const poke = this.pokeRepository.create({
      sender,
      receiver,
      isReturned: false
    });

    const savedPoke = await this.pokeRepository.save(poke);

    // Send notification to receiver
    await this.notificationsService.createNotification(
      receiver,
      NotificationType.POKE,
      {
        pokeId: savedPoke.id,
        senderId: sender.id,
        senderUsername: sender.username,
        senderAvatar: sender.avatar
      }
    );

    return savedPoke;
  }

  async getPokes(userId: string): Promise<Poke[]> {
    return this.pokeRepository.find({
      where: { receiver: { id: userId }, isReturned: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' }
    });
  }

  async returnPoke(pokeId: string, userId: string): Promise<Poke> {
    const poke = await this.pokeRepository.findOne({
      where: { id: pokeId, receiver: { id: userId } }
    });

    if (!poke) {
      throw new NotFoundException('Poke not found');
    }

    poke.isReturned = true;
    const returnedPoke = await this.pokeRepository.save(poke);

    // Create a new poke back from the current user to the original sender
    const receiver = await this.findOneById(userId);
    const sender = await this.findOneById(poke.sender.id);
    
    if (receiver && sender) {
      const newPoke = this.pokeRepository.create({
        sender: receiver,
        receiver: sender,
        isReturned: false
      });
      await this.pokeRepository.save(newPoke);

      // Send notification to original sender
      await this.notificationsService.createNotification(
        sender,
        NotificationType.POKE,
        {
          senderId: receiver.id,
          senderUsername: receiver.username,
          senderAvatar: receiver.avatar,
          isReturnPoke: true
        }
      );
    }

    return returnedPoke;
  }

  async dismissPoke(pokeId: string, userId: string): Promise<void> {
    const poke = await this.pokeRepository.findOne({
      where: { id: pokeId, receiver: { id: userId } }
    });

    if (!poke) {
      throw new NotFoundException('Poke not found');
    }

    poke.isReturned = true;
    await this.pokeRepository.save(poke);
  }

  async verifyUser(userId: string, adminUserId: string): Promise<User> {
    // Check if admin user has admin role
    const adminUser = await this.findOneById(adminUserId);
    if (!adminUser || adminUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can verify users');
    }

    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.verified = true;
    user.verificationStatus = 'approved';
    return this.usersRepository.save(user);
  }

  async unverifyUser(userId: string, adminUserId: string): Promise<User> {
    // Check if admin user has admin role
    const adminUser = await this.findOneById(adminUserId);
    if (!adminUser || adminUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can unverify users');
    }

    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.verified = false;
    user.verificationStatus = undefined;
    return this.usersRepository.save(user);
  }

  async rejectVerification(userId: string, adminUserId: string): Promise<User> {
    // Check if admin user has admin role
    const adminUser = await this.findOneById(adminUserId);
    if (!adminUser || adminUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can reject verification requests');
    }

    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.verified = false;
    user.verificationStatus = 'rejected';
    return this.usersRepository.save(user);
  }

  async submitVerification(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload ID document to storage
    const idDocumentUrl = await this.storageService.upload(file.buffer);
    
    user.idDocumentUrl = idDocumentUrl;
    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    return this.usersRepository.save(user);
  }

  async getPendingVerifications(adminUserId: string): Promise<User[]> {
    // Check if admin user has admin role
    const adminUser = await this.findOneById(adminUserId);
    if (!adminUser || adminUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can view pending verification requests');
    }

    return this.usersRepository.find({
      where: { verificationStatus: 'pending' },
      select: ['id', 'username', 'displayName', 'email', 'idDocumentUrl', 'verificationSubmittedAt']
    });
  }
}