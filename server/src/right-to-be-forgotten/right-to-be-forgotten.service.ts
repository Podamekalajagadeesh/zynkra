import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErasureRequest, ErasureStatus, ErasureDataType } from './entities/erasure-request.entity';

@Injectable()
export class RightToBeForgottenService {
  constructor(
    @InjectRepository(ErasureRequest)
    private readonly requestRepository: Repository<ErasureRequest>,
  ) {}

  async createErasureRequest(
    userId: string,
    data: {
      dataTypes?: ErasureDataType[];
      reason?: string;
    },
  ) {
    const request = this.requestRepository.create({
      userId,
      dataTypes: data.dataTypes || [ErasureDataType.ALL],
      reason: data.reason,
      status: ErasureStatus.PENDING,
    });
    return this.requestRepository.save(request);
  }

  async getUserRequests(userId: string) {
    return this.requestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllRequests() {
    return this.requestRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async updateRequestStatus(
    requestId: string,
    status: ErasureStatus,
    erasedItems?: any,
  ) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    request.status = status;
    if (erasedItems) {
      request.erasedItems = erasedItems;
    }
    if (status === ErasureStatus.COMPLETED) {
      request.completedAt = new Date();
    }
    return this.requestRepository.save(request);
  }

  async cancelRequest(requestId: string, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, userId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    request.status = ErasureStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  async getStats() {
    const [total, pending, completed] = await Promise.all([
      this.requestRepository.count(),
      this.requestRepository.count({ where: { status: ErasureStatus.PENDING } }),
      this.requestRepository.count({ where: { status: ErasureStatus.COMPLETED } }),
    ]);
    return { total, pending, completed };
  }
}
