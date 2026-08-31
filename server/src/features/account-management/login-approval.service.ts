import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LoginApproval, LoginApprovalStatus } from './entities/login-approval.entity';
import { ApproveLoginRequestDto, RejectLoginRequestDto } from './dto/login-approval.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { randomBytes } from 'crypto';

@Injectable()
export class LoginApprovalService {
  private readonly logger = new Logger(LoginApprovalService.name);
  private readonly APPROVAL_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(LoginApproval)
    private loginApprovalRepository: Repository<LoginApproval>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async createLoginApprovalRequest(
    userId: string,
    deviceName: string,
    ipAddress?: string,
    userAgent?: string,
    location?: string,
  ): Promise<LoginApproval> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Parse browser and OS info from user agent
    const { browser, os } = this.parseUserAgent(userAgent);

    const approvalToken = this.generateApprovalToken();

    const loginApproval = this.loginApprovalRepository.create({
      user,
      userId,
      deviceName,
      ipAddress,
      userAgent,
      location,
      browser,
      os,
      status: LoginApprovalStatus.PENDING,
      approvalToken,
      tokenExpiresAt: new Date(Date.now() + this.APPROVAL_TOKEN_EXPIRY),
    });

    const saved = await this.loginApprovalRepository.save(loginApproval);

    // Send notification
    await this.notificationsService.createNotification({
      userId,
      title: 'New Login Attempt',
      message: `A new login attempt was detected on ${deviceName} from ${location || ipAddress || 'unknown location'}`,
      type: 'login_approval_required',
      metadata: {
        approvalId: saved.id,
        deviceName,
        ipAddress,
        location,
      },
    } as any);

    this.logger.log(`Login approval request created: ${saved.id} for user ${userId}`);

    return saved;
  }

  async approveLoginRequest(
    approvalId: string,
    userId: string,
    approveDto: ApproveLoginRequestDto,
  ): Promise<LoginApproval> {
    const loginApproval = await this.loginApprovalRepository.findOne({ where: { id: approvalId } });

    if (!loginApproval || loginApproval.userId !== userId) {
      throw new NotFoundException('Login approval request not found');
    }

    if (loginApproval.status !== LoginApprovalStatus.PENDING) {
      throw new BadRequestException('This login approval request has already been processed');
    }

    if (loginApproval.tokenExpiresAt && loginApproval.tokenExpiresAt < new Date()) {
      loginApproval.status = LoginApprovalStatus.EXPIRED;
      await this.loginApprovalRepository.save(loginApproval);
      throw new BadRequestException('This login approval request has expired');
    }

    loginApproval.status = LoginApprovalStatus.APPROVED;
    loginApproval.approvedAt = new Date();
    loginApproval.rememberDevice = approveDto.rememberDevice || false;
    loginApproval.reviewerNote = approveDto.reviewerNote;

    const saved = await this.loginApprovalRepository.save(loginApproval);

    await this.notificationsService.createNotification({
      userId,
      title: 'Login Approved',
      message: `Your login on ${loginApproval.deviceName} has been approved`,
      type: 'login_approved',
      metadata: { approvalId, deviceName: loginApproval.deviceName },
    } as any);

    this.logger.log(`Login approval ${approvalId} approved by user ${userId}`);

    return saved;
  }

  async rejectLoginRequest(
    approvalId: string,
    userId: string,
    rejectDto: RejectLoginRequestDto,
  ): Promise<LoginApproval> {
    const loginApproval = await this.loginApprovalRepository.findOne({ where: { id: approvalId } });

    if (!loginApproval || loginApproval.userId !== userId) {
      throw new NotFoundException('Login approval request not found');
    }

    if (loginApproval.status !== LoginApprovalStatus.PENDING) {
      throw new BadRequestException('This login approval request has already been processed');
    }

    loginApproval.status = LoginApprovalStatus.REJECTED;
    loginApproval.reviewedAt = new Date();
    loginApproval.reviewerNote = rejectDto.reviewerNote;

    const saved = await this.loginApprovalRepository.save(loginApproval);

    await this.notificationsService.createNotification({
      userId,
      title: 'Login Rejected',
      message: `A login attempt on ${loginApproval.deviceName} was rejected. Reason: ${rejectDto.rejectionReason}`,
      type: 'login_rejected',
      metadata: { approvalId, reason: rejectDto.rejectionReason },
    } as any);

    this.logger.log(`Login approval ${approvalId} rejected by user ${userId}`);

    return saved;
  }

  async getUserPendingApprovals(userId: string): Promise<LoginApproval[]> {
    return this.loginApprovalRepository.find({
      where: {
        user: { id: userId },
        status: LoginApprovalStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserApprovalHistory(userId: string, limit: number = 50, offset: number = 0): Promise<[LoginApproval[], number]> {
    return this.loginApprovalRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getApprovalRequest(approvalId: string): Promise<LoginApproval> {
    const approval = await this.loginApprovalRepository.findOne({ where: { id: approvalId } });
    if (!approval) {
      throw new NotFoundException('Login approval request not found');
    }
    return approval;
  }

  async verifyApprovalToken(approvalId: string, token: string): Promise<boolean> {
    const approval = await this.getApprovalRequest(approvalId);

    if (approval.approvalToken !== token) {
      return false;
    }

    if (approval.tokenExpiresAt && approval.tokenExpiresAt < new Date()) {
      return false;
    }

    return true;
  }

  async rememberDevice(approvalId: string, userId: string): Promise<LoginApproval> {
    const approval = await this.loginApprovalRepository.findOne({ where: { id: approvalId } });

    if (!approval || approval.userId !== userId) {
      throw new NotFoundException('Login approval request not found');
    }

    approval.rememberDevice = true;
    return this.loginApprovalRepository.save(approval);
  }

  async cleanupExpiredApprovals(): Promise<number> {
    const result = await this.loginApprovalRepository.delete({
      status: LoginApprovalStatus.PENDING,
      tokenExpiresAt: { value: () => `NOW()`, operator: '<' } as any,
    });

    return result.affected || 0;
  }

  async getLoginApprovalStats(userId: string) {
    const [all, total] = await this.loginApprovalRepository.findAndCount({
      where: { user: { id: userId } },
    });

    const approved = all.filter(a => a.status === LoginApprovalStatus.APPROVED).length;
    const rejected = all.filter(a => a.status === LoginApprovalStatus.REJECTED).length;
    const pending = all.filter(a => a.status === LoginApprovalStatus.PENDING).length;
    const remembered = all.filter(a => a.rememberDevice).length;

    return {
      total,
      approved,
      rejected,
      pending,
      remembered,
      recentApprovals: all.slice(0, 5),
    };
  }

  private generateApprovalToken(): string {
    return randomBytes(32).toString('hex');
  }

  private parseUserAgent(userAgent?: string): { browser: string | null; os: string | null } {
    if (!userAgent) {
      return { browser: null, os: null };
    }

    let browser: string | null = null;
    let os: string | null = null;

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return { browser, os };
  }
}
