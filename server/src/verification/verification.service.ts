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
} from './entities/verification-request.entity';
import { User } from '../users/entities/user.entity';
import { CreateVerificationRequestDto } from './dto/verification.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly requestsRepository: Repository<VerificationRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    const request = this.requestsRepository.create({
      user,
      category: dto.category,
      justification: dto.justification,
      links: dto.links,
    });
    return this.requestsRepository.save(request);
  }

  /** The applicant's most recent request, for status display. */
  async getMyRequest(userId: string): Promise<VerificationRequest | null> {
    return this.requestsRepository.findOne({
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
