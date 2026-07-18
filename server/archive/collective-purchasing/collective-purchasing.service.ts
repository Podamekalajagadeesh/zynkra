import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectivePurchase, CollectivePurchaseParticipant, PurchaseStatus } from './entities/collective-purchase.entity';

@Injectable()
export class CollectivePurchasingService {
  constructor(
    @InjectRepository(CollectivePurchase)
    private readonly purchaseRepository: Repository<CollectivePurchase>,
    @InjectRepository(CollectivePurchaseParticipant)
    private readonly participantRepository: Repository<CollectivePurchaseParticipant>,
  ) {}

  async createPurchase(creatorId: string, data: Partial<CollectivePurchase>) {
    const purchase = this.purchaseRepository.create({
      ...data,
      creatorId,
      status: PurchaseStatus.FUNDING,
    });
    return this.purchaseRepository.save(purchase);
  }

  async getAllPurchases() {
    return this.purchaseRepository.find({
      relations: ['creator', 'participants'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPurchaseById(id: string) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id },
      relations: ['creator', 'participants'],
    });
    if (!purchase) {
      throw new NotFoundException('Collective purchase not found');
    }
    return purchase;
  }

  async joinPurchase(userId: string, purchaseId: string, amount: number) {
    const purchase = await this.getPurchaseById(purchaseId);
    if (purchase.status !== PurchaseStatus.FUNDING) {
      throw new BadRequestException('This purchase is not open for funding');
    }
    if (purchase.currentAmount + amount > purchase.totalPrice) {
      throw new BadRequestException('This contribution would exceed total price');
    }

    const participant = this.participantRepository.create({
      purchaseId,
      userId,
      contributionAmount: amount,
    });

    const newAmount = purchase.currentAmount + amount;
    purchase.currentAmount = newAmount;

    if (newAmount >= purchase.totalPrice && purchase.participants.length + 1 >= purchase.minParticipants) {
      purchase.status = PurchaseStatus.FUNDED;
    }

    await this.purchaseRepository.save(purchase);
    return this.participantRepository.save(participant);
  }

  async cancelPurchase(id: string, userId: string) {
    const purchase = await this.getPurchaseById(id);
    if (purchase.creatorId !== userId) {
      throw new ForbiddenException('Only creator can cancel');
    }
    purchase.status = PurchaseStatus.CANCELLED;
    return this.purchaseRepository.save(purchase);
  }

  async getUserPurchases(userId: string) {
    return this.participantRepository.find({
      where: { userId },
      relations: ['collectivePurchase'],
    });
  }
}
