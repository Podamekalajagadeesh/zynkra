import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationRequest, VerificationRequestType, VerificationRequestStatus } from './entities/verification-request.entity';
import { VerificationBadge, BadgeType } from './entities/verification-badge.entity';
import { VerificationHistory, VerificationHistoryEventType } from './entities/verification-history.entity';
import { VerificationAppeal, VerificationAppealStatus } from './entities/verification-appeal.entity';
import { CreateVerificationRequestDto, ApproveVerificationRequestDto, RejectVerificationRequestDto, AppealVerificationDecisionDto } from './dto/create-verification-request.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(VerificationRequest)
    private verificationRequestRepository: Repository<VerificationRequest>,
    @InjectRepository(VerificationBadge)
    private verificationBadgeRepository: Repository<VerificationBadge>,
    @InjectRepository(VerificationHistory)
    private verificationHistoryRepository: Repository<VerificationHistory>,
    @InjectRepository(VerificationAppeal)
    private verificationAppealRepository: Repository<VerificationAppeal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // ============ VERIFICATION REQUEST METHODS ============

  async submitVerificationRequest(
    userId: string,
    createVerificationRequestDto: CreateVerificationRequestDto,
  ): Promise<VerificationRequest> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if there's already a pending request for this type
    const existingRequest = await this.verificationRequestRepository.findOne({
      where: {
        user: { id: userId },
        type: createVerificationRequestDto.type,
        status: VerificationRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending verification request for this type');
    }

    const verificationRequest = this.verificationRequestRepository.create({
      user,
      userId,
      type: createVerificationRequestDto.type,
      status: VerificationRequestStatus.PENDING,
      description: createVerificationRequestDto.description,
      documentUrl: createVerificationRequestDto.documentUrl,
      metadata: createVerificationRequestDto.metadata,
    });

    const saved = await this.verificationRequestRepository.save(verificationRequest);

    // Record history
    await this.recordHistory(
      userId,
      VerificationHistoryEventType.REQUEST_SUBMITTED,
      `Submitted ${createVerificationRequestDto.type} verification request`,
      { requestId: saved.id, type: createVerificationRequestDto.type },
    );

    this.logger.log(`Verification request ${saved.id} submitted by user ${userId}`);

    return saved;
  }

  async getVerificationRequest(requestId: string): Promise<VerificationRequest> {
    const request = await this.verificationRequestRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }
    return request;
  }

  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    return this.verificationRequestRepository.find({
      where: { user: { id: userId } },
      order: { submittedAt: 'DESC' },
    });
  }

  async getAllPendingVerifications(limit: number = 50, offset: number = 0): Promise<[VerificationRequest[], number]> {
    return this.verificationRequestRepository.findAndCount({
      where: { status: VerificationRequestStatus.PENDING },
      order: { submittedAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  // ============ VERIFICATION APPROVAL METHODS ============

  async approveVerificationRequest(
    requestId: string,
    reviewerId: string,
    approveDto: ApproveVerificationRequestDto,
  ): Promise<VerificationRequest> {
    const verificationRequest = await this.getVerificationRequest(requestId);

    if (verificationRequest.status !== VerificationRequestStatus.PENDING && 
        verificationRequest.status !== VerificationRequestStatus.UNDER_REVIEW) {
      throw new BadRequestException('Only pending or under-review requests can be approved');
    }

    verificationRequest.status = VerificationRequestStatus.APPROVED;
    verificationRequest.reviewedBy = reviewerId;
    verificationRequest.reviewedAt = new Date();

    const saved = await this.verificationRequestRepository.save(verificationRequest);

    // Grant badge
    const badgeType = this.mapVerificationTypeToBadgeType(verificationRequest.type);
    await this.grantBadge(verificationRequest.userId, badgeType, reviewerId);

    // Update user verification status
    const user = verificationRequest.user;
    if (verificationRequest.type === VerificationRequestType.IDENTITY) {
      user.verified = true;
      user.verificationStatus = 'approved';
      await this.usersRepository.save(user);
    } else if (verificationRequest.type === VerificationRequestType.AGE) {
      user.birthDateVerifiedAt = new Date();
      await this.usersRepository.save(user);
    }

    // Record history
    await this.recordHistory(
      verificationRequest.userId,
      VerificationHistoryEventType.APPROVED,
      `${verificationRequest.type} verification approved`,
      { requestId, reviewerId, notes: approveDto.notes },
    );

    // Notify user
    await this.notificationsService.createNotification({
      userId: verificationRequest.userId,
      title: 'Verification Approved',
      message: `Your ${verificationRequest.type} verification has been approved!`,
      type: 'verification_approved',
      metadata: { requestId, type: verificationRequest.type },
    } as any);

    this.logger.log(`Verification request ${requestId} approved by ${reviewerId}`);

    return saved;
  }

  async rejectVerificationRequest(
    requestId: string,
    reviewerId: string,
    rejectDto: RejectVerificationRequestDto,
  ): Promise<VerificationRequest> {
    const verificationRequest = await this.getVerificationRequest(requestId);

    if (verificationRequest.status !== VerificationRequestStatus.PENDING && 
        verificationRequest.status !== VerificationRequestStatus.UNDER_REVIEW) {
      throw new BadRequestException('Only pending or under-review requests can be rejected');
    }

    verificationRequest.status = VerificationRequestStatus.REJECTED;
    verificationRequest.rejectionReason = rejectDto.rejectionReason;
    verificationRequest.reviewedBy = reviewerId;
    verificationRequest.reviewedAt = new Date();
    verificationRequest.nextAppealEligibleAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const saved = await this.verificationRequestRepository.save(verificationRequest);

    // Record history
    await this.recordHistory(
      verificationRequest.userId,
      VerificationHistoryEventType.REJECTED,
      `${verificationRequest.type} verification rejected`,
      { requestId, reviewerId, reason: rejectDto.rejectionReason, notes: rejectDto.notes },
    );

    // Notify user
    await this.notificationsService.createNotification({
      userId: verificationRequest.userId,
      title: 'Verification Rejected',
      message: `Your ${verificationRequest.type} verification was not approved. Reason: ${rejectDto.rejectionReason}`,
      type: 'verification_rejected',
      metadata: { requestId, type: verificationRequest.type, reason: rejectDto.rejectionReason },
    } as any);

    this.logger.log(`Verification request ${requestId} rejected by ${reviewerId}`);

    return saved;
  }

  async markUnderReview(requestId: string, reviewerId: string): Promise<VerificationRequest> {
    const verificationRequest = await this.getVerificationRequest(requestId);

    if (verificationRequest.status !== VerificationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be marked as under review');
    }

    verificationRequest.status = VerificationRequestStatus.UNDER_REVIEW;
    verificationRequest.reviewedBy = reviewerId;

    const saved = await this.verificationRequestRepository.save(verificationRequest);

    await this.recordHistory(
      verificationRequest.userId,
      VerificationHistoryEventType.UNDER_REVIEW,
      `${verificationRequest.type} verification marked under review`,
      { requestId, reviewerId },
    );

    await this.notificationsService.createNotification({
      userId: verificationRequest.userId,
      title: 'Verification Under Review',
      message: `Your ${verificationRequest.type} verification is now under review`,
      type: 'verification_under_review',
      metadata: { requestId, type: verificationRequest.type },
    } as any);

    return saved;
  }

  // ============ BADGE MANAGEMENT METHODS ============

  async grantBadge(userId: string, badgeType: BadgeType, grantedBy: string): Promise<VerificationBadge> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if badge already exists and is active
    const existingBadge = await this.verificationBadgeRepository.findOne({
      where: {
        user: { id: userId },
        type: badgeType,
        isActive: true,
      },
    });

    if (existingBadge) {
      return existingBadge;
    }

    const badge = this.verificationBadgeRepository.create({
      user,
      userId,
      type: badgeType,
      displayName: this.getBadgeDisplayName(badgeType),
      description: this.getBadgeDescription(badgeType),
      grantedBy,
      grantedAt: new Date(),
      isActive: true,
    });

    const saved = await this.verificationBadgeRepository.save(badge);

    await this.recordHistory(
      userId,
      VerificationHistoryEventType.BADGE_GRANTED,
      `${badgeType} badge granted`,
      { badgeId: saved.id, badgeType, grantedBy },
    );

    this.logger.log(`Badge ${badgeType} granted to user ${userId}`);

    return saved;
  }

  async revokeBadge(badgeId: string, revocationReason: string, revokedBy: string): Promise<VerificationBadge> {
    const badge = await this.verificationBadgeRepository.findOne({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    badge.isActive = false;
    badge.revokedAt = new Date();
    badge.revocationReason = revocationReason;

    const saved = await this.verificationBadgeRepository.save(badge);

    await this.recordHistory(
      badge.userId,
      VerificationHistoryEventType.BADGE_REVOKED,
      `${badge.type} badge revoked`,
      { badgeId, reason: revocationReason, revokedBy },
    );

    await this.notificationsService.createNotification({
      userId: badge.userId,
      title: 'Badge Revoked',
      message: `Your ${badge.type} badge has been revoked. Reason: ${revocationReason}`,
      type: 'badge_revoked',
      metadata: { badgeId, badgeType: badge.type },
    } as any);

    this.logger.log(`Badge ${badgeId} revoked for user ${badge.userId}`);

    return saved;
  }

  async getUserBadges(userId: string): Promise<VerificationBadge[]> {
    return this.verificationBadgeRepository.find({
      where: { user: { id: userId }, isActive: true },
      order: { grantedAt: 'DESC' },
    });
  }

  async getActiveBadgesByType(badgeType: BadgeType): Promise<VerificationBadge[]> {
    return this.verificationBadgeRepository.find({
      where: { type: badgeType, isActive: true },
      order: { grantedAt: 'DESC' },
    });
  }

  // ============ VERIFICATION APPEAL METHODS ============

  async submitAppeal(
    requestId: string,
    userId: string,
    appealDto: AppealVerificationDecisionDto,
  ): Promise<VerificationAppeal> {
    const verificationRequest = await this.getVerificationRequest(requestId);

    if (verificationRequest.user.id !== userId) {
      throw new BadRequestException('You can only appeal your own verification requests');
    }

    if (verificationRequest.status !== VerificationRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected requests can be appealed');
    }

    // Check if eligible for appeal
    if (verificationRequest.nextAppealEligibleAt && verificationRequest.nextAppealEligibleAt > new Date()) {
      throw new BadRequestException('You must wait before appealing this decision');
    }

    // Check if already appealed too many times
    if (verificationRequest.appealCount >= 3) {
      throw new BadRequestException('Maximum appeal limit reached for this request');
    }

    const appeal = this.verificationAppealRepository.create({
      user: verificationRequest.user,
      userId,
      requestId,
      reason: appealDto.appealReason,
      documentUrls: appealDto.documentUrls,
      links: appealDto.links,
      status: VerificationAppealStatus.PENDING,
      metadata: appealDto.metadata,
    });

    const saved = await this.verificationAppealRepository.save(appeal);

    verificationRequest.appealCount += 1;
    verificationRequest.status = VerificationRequestStatus.APPEAL_PENDING;
    await this.verificationRequestRepository.save(verificationRequest);

    await this.recordHistory(
      userId,
      VerificationHistoryEventType.APPEAL_SUBMITTED,
      `Appeal submitted for ${verificationRequest.type} verification`,
      { requestId, appealId: saved.id },
    );

    this.logger.log(`Appeal ${saved.id} submitted by user ${userId}`);

    return saved;
  }

  async approveAppeal(appealId: string, reviewerId: string): Promise<VerificationAppeal> {
    const appeal = await this.verificationAppealRepository.findOne({ where: { id: appealId } });
    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    const verificationRequest = await this.getVerificationRequest(appeal.requestId);

    appeal.status = VerificationAppealStatus.APPROVED;
    appeal.reviewedAt = new Date();
    appeal.reviewedBy = reviewerId;

    const savedAppeal = await this.verificationAppealRepository.save(appeal);

    // Update the original request to approved
    await this.approveVerificationRequest(verificationRequest.id, reviewerId, { notes: 'Approved via appeal' });

    await this.recordHistory(
      appeal.userId,
      VerificationHistoryEventType.APPEAL_APPROVED,
      `Appeal approved for ${verificationRequest.type} verification`,
      { appealId, requestId: appeal.requestId },
    );

    this.logger.log(`Appeal ${appealId} approved by ${reviewerId}`);

    return savedAppeal;
  }

  async rejectAppeal(appealId: string, reviewerId: string, notes: string): Promise<VerificationAppeal> {
    const appeal = await this.verificationAppealRepository.findOne({ where: { id: appealId } });
    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    const verificationRequest = await this.getVerificationRequest(appeal.requestId);

    appeal.status = VerificationAppealStatus.REJECTED;
    appeal.reviewedAt = new Date();
    appeal.reviewedBy = reviewerId;
    appeal.reviewNotes = notes;

    const savedAppeal = await this.verificationAppealRepository.save(appeal);

    // Set next eligible appeal time to 30 days
    verificationRequest.nextAppealEligibleAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.verificationRequestRepository.save(verificationRequest);

    await this.recordHistory(
      appeal.userId,
      VerificationHistoryEventType.APPEAL_REJECTED,
      `Appeal rejected for ${verificationRequest.type} verification`,
      { appealId, requestId: appeal.requestId, notes },
    );

    await this.notificationsService.createNotification({
      userId: appeal.userId,
      title: 'Appeal Rejected',
      message: `Your appeal for ${verificationRequest.type} verification was not approved. ${notes}`,
      type: 'appeal_rejected',
      metadata: { appealId, requestId: appeal.requestId },
    } as any);

    this.logger.log(`Appeal ${appealId} rejected by ${reviewerId}`);

    return savedAppeal;
  }

  async getUserAppeals(userId: string): Promise<VerificationAppeal[]> {
    return this.verificationAppealRepository.find({
      where: { user: { id: userId } },
      order: { submittedAt: 'DESC' },
    });
  }

  // ============ VERIFICATION HISTORY METHODS ============

  async recordHistory(
    userId: string,
    eventType: VerificationHistoryEventType,
    description: string,
    metadata?: Record<string, any>,
    performedBy?: string,
  ): Promise<VerificationHistory> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const history = this.verificationHistoryRepository.create({
      user,
      userId,
      eventType,
      description,
      metadata,
      performedBy,
    });

    return this.verificationHistoryRepository.save(history);
  }

  async getUserVerificationHistory(userId: string, limit: number = 50, offset: number = 0): Promise<[VerificationHistory[], number]> {
    return this.verificationHistoryRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ============ HELPER METHODS ============

  private mapVerificationTypeToBadgeType(type: VerificationRequestType): BadgeType {
    const mapping: Record<VerificationRequestType, BadgeType> = {
      [VerificationRequestType.CREATOR]: BadgeType.CREATOR,
      [VerificationRequestType.BUSINESS]: BadgeType.BUSINESS,
      [VerificationRequestType.ORGANIZATION]: BadgeType.ORGANIZATION,
      [VerificationRequestType.IDENTITY]: BadgeType.VERIFIED_IDENTITY,
      [VerificationRequestType.AGE]: BadgeType.VERIFIED_AGE,
    };
    return mapping[type];
  }

  private getBadgeDisplayName(badgeType: BadgeType): string {
    const names: Record<BadgeType, string> = {
      [BadgeType.CREATOR]: '✓ Creator',
      [BadgeType.BUSINESS]: '✓ Business',
      [BadgeType.ORGANIZATION]: '✓ Organization',
      [BadgeType.VERIFIED_IDENTITY]: '✓ Verified Identity',
      [BadgeType.VERIFIED_AGE]: '✓ Verified Age',
      [BadgeType.OFFICIAL]: '★ Official',
      [BadgeType.TRUSTED]: '★ Trusted',
    };
    return names[badgeType];
  }

  private getBadgeDescription(badgeType: BadgeType): string {
    const descriptions: Record<BadgeType, string> = {
      [BadgeType.CREATOR]: 'This account has been verified as a creator',
      [BadgeType.BUSINESS]: 'This account has been verified as a business',
      [BadgeType.ORGANIZATION]: 'This account has been verified as an organization',
      [BadgeType.VERIFIED_IDENTITY]: 'This account has completed identity verification',
      [BadgeType.VERIFIED_AGE]: 'This account has completed age verification',
      [BadgeType.OFFICIAL]: 'This is an official account',
      [BadgeType.TRUSTED]: 'This account is trusted',
    };
    return descriptions[badgeType];
  }

  async getVerificationStats(userId: string) {
    const [requests, requestCount] = await this.verificationRequestRepository.findAndCount({
      where: { user: { id: userId } },
    });

    const badges = await this.getUserBadges(userId);
    const [history] = await this.getUserVerificationHistory(userId, 100);
    const appeals = await this.getUserAppeals(userId);

    return {
      totalRequests: requestCount,
      pendingRequests: requests.filter(r => r.status === VerificationRequestStatus.PENDING).length,
      approvedRequests: requests.filter(r => r.status === VerificationRequestStatus.APPROVED).length,
      rejectedRequests: requests.filter(r => r.status === VerificationRequestStatus.REJECTED).length,
      activeBadges: badges.length,
      badges: badges.map(b => b.type),
      totalAppeals: appeals.length,
      pendingAppeals: appeals.filter(a => a.status === VerificationAppealStatus.PENDING).length,
      recentHistory: history.slice(0, 10),
    };
  }
}
