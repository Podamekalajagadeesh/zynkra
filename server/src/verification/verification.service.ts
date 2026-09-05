import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VerificationRequest,
  VerificationStatus,
  VerificationWorkflow,
} from './entities/verification-request.entity';
import { VerificationAppeal, VerificationAppealStatus } from './entities/verification-appeal.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateVerificationRequestDto,
  SubmitVerificationAppealDto,
} from './dto/verification.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly requestsRepository: Repository<VerificationRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(VerificationAppeal)
    private readonly appealsRepository: Repository<VerificationAppeal>,
  ) {}

  async apply(userId: string, dto: CreateVerificationRequestDto): Promise<VerificationRequest> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.verified) {
      throw new BadRequestException('This account is already verified.');
    }

    const pending = await this.requestsRepository.findOne({
      where: { user: { id: userId }, status: VerificationStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException('You already have a pending verification request.');
    }

    const workflow = (dto.workflow ?? VerificationWorkflow.PERSONAL) as VerificationWorkflow;
    const request = this.requestsRepository.create({
      user,
      workflow,
      category: dto.category,
      organizationName: dto.organizationName ?? null,
      documentType: dto.documentType ?? null,
      justification: dto.justification,
      links: dto.links,
    } as Partial<VerificationRequest>);
    return this.requestsRepository.save(request as VerificationRequest);
  }


  async submitAppeal(
    userId: string,
    requestId: string,
    dto: SubmitVerificationAppealDto,
  ): Promise<VerificationAppeal> {
    const request = await this.requestsRepository.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Verification request not found.');
    if (request.user.id !== userId) throw new BadRequestException('You can only appeal your own request.');
    if (request.status !== VerificationStatus.REJECTED) {
      throw new BadRequestException('Only rejected verification requests can be appealed.');
    }

    const appeals = await this.appealsRepository.find({ where: { requestId }, order: { submittedAt: 'DESC' } });
    if (appeals.some((appeal) => appeal.status === VerificationAppealStatus.PENDING || appeal.status === VerificationAppealStatus.UNDER_REVIEW)) {
      throw new BadRequestException('This request already has an appeal under review.');
    }
    if (appeals.length >= 3) throw new BadRequestException('Maximum appeal limit reached for this request.');

    const lastRejected = appeals.find((appeal) => appeal.status === VerificationAppealStatus.REJECTED);
    if (lastRejected && lastRejected.reviewedAt && lastRejected.reviewedAt.getTime() + 30 * 24 * 60 * 60 * 1000 > Date.now()) {
      throw new BadRequestException('You must wait 30 days before submitting another appeal.');
    }

    if (!dto.appealReason || dto.appealReason.trim().length < 20) {
      throw new BadRequestException('Appeal reason must be at least 20 characters.');
    }

    const appeal = this.appealsRepository.create({
      user: request.user,
      userId,
      request,
      requestId,
      reason: dto.appealReason,
      documentUrls: dto.documentUrls ?? [],
      links: dto.links ?? [],
      status: VerificationAppealStatus.PENDING,
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    });

    request.status = VerificationStatus.UNDER_REVIEW;
    await this.requestsRepository.save(request);

    return this.appealsRepository.save(appeal);
  }

  async getUserAppeals(userId: string): Promise<VerificationAppeal[]> {
    return this.appealsRepository.find({ where: { userId }, order: { submittedAt: 'DESC' } });
  }

  async getAppeal(appealId: string, userId: string): Promise<VerificationAppeal> {
    const appeal = await this.appealsRepository.findOne({ where: { id: appealId } });
    if (!appeal) throw new NotFoundException('Verification appeal not found.');
    if (appeal.userId !== userId) throw new BadRequestException('You can only view your own appeal.');
    return appeal;
  }

  async listAppeals(status?: VerificationAppealStatus): Promise<VerificationAppeal[]> {
    return this.appealsRepository.find({
      where: status ? { status } : {},
      order: { submittedAt: 'ASC' },
    });
  }

  async markAppealUnderReview(appealId: string, reviewerId: string): Promise<VerificationAppeal> {
    return this.reviewAppeal(appealId, reviewerId, VerificationAppealStatus.UNDER_REVIEW);
  }

  async reviewAppeal(
    appealId: string,
    reviewerId: string,
    status: VerificationAppealStatus.APPROVED | VerificationAppealStatus.REJECTED | VerificationAppealStatus.UNDER_REVIEW,
    notes?: string,
  ): Promise<VerificationAppeal> {
    const appeal = await this.appealsRepository.findOne({ where: { id: appealId } });
    if (!appeal) throw new NotFoundException('Verification appeal not found.');
    if (appeal.status !== VerificationAppealStatus.PENDING && appeal.status !== VerificationAppealStatus.UNDER_REVIEW) {
      throw new BadRequestException('This appeal has already been reviewed.');
    }
    appeal.status = status;
    appeal.reviewedBy = reviewerId;
    appeal.reviewNotes = notes ?? appeal.reviewNotes;
    if (status !== VerificationAppealStatus.UNDER_REVIEW) {
      appeal.reviewedAt = new Date();
      const request = await this.requestsRepository.findOne({ where: { id: appeal.requestId } });
      if (!request) throw new NotFoundException('Verification request not found.');

      if (status === VerificationAppealStatus.APPROVED) {
        request.status = VerificationStatus.APPROVED;
        request.reviewNote = notes ?? 'Approved via appeal';
        request.reviewedBy = await this.usersRepository.findOne({ where: { id: reviewerId } });
        await this.requestsRepository.save(request);
        await this.usersRepository.update(request.user.id, { verified: true });
      }

      if (status === VerificationAppealStatus.REJECTED) {
        request.status = VerificationStatus.REJECTED;
        request.reviewNote = notes ?? 'Appeal rejected';
        request.reviewedBy = await this.usersRepository.findOne({ where: { id: reviewerId } });
        await this.requestsRepository.save(request);
      }
    }
    return this.appealsRepository.save(appeal);
  }
  /** The applicant's most recent request, for status display. */
  async getMyRequest(userId: string): Promise<VerificationRequest | null> {
    return this.requestsRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getMyHistory(userId: string): Promise<VerificationRequest[]> {
    return this.requestsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async listPending(take = 20, skip = 0): Promise<VerificationRequest[]> {
    return this.requestsRepository.find({
      where: { status: VerificationStatus.PENDING },
      order: { createdAt: 'ASC' },
      take,
      skip,
    });
  }

  async review(
    requestId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ): Promise<VerificationRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Verification request not found.');
    if (request.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    const reviewer = await this.usersRepository.findOne({ where: { id: reviewerId } });

    request.status =
      decision === 'approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    request.reviewNote = reviewNote ?? null;
    request.reviewedBy = reviewer;
    await this.requestsRepository.save(request);

    if (decision === 'approved') {
      await this.usersRepository.update(request.user.id, { verified: true });
    }

    return request;
  }
}
