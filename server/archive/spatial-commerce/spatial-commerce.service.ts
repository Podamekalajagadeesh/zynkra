import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualStorefront } from './entities/virtual-storefront.entity';

@Injectable()
export class SpatialCommerceService {
  constructor(
    @InjectRepository(VirtualStorefront)
    private readonly storefrontRepository: Repository<VirtualStorefront>,
  ) {}

  async createStorefront(ownerId: string, data: Partial<VirtualStorefront>) {
    const storefront = this.storefrontRepository.create({
      ...data,
      ownerId,
    });
    return this.storefrontRepository.save(storefront);
  }

  async getAllStorefronts() {
    return this.storefrontRepository.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStorefrontById(id: string) {
    const storefront = await this.storefrontRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!storefront) {
      throw new NotFoundException('Storefront not found');
    }
    return storefront;
  }

  async updateStorefront(id: string, ownerId: string, data: Partial<VirtualStorefront>) {
    const storefront = await this.getStorefrontById(id);
    if (storefront.ownerId !== ownerId) {
      throw new ForbiddenException('Only owner can update this storefront');
    }
    Object.assign(storefront, data);
    return this.storefrontRepository.save(storefront);
  }

  async deleteStorefront(id: string, ownerId: string) {
    const storefront = await this.getStorefrontById(id);
    if (storefront.ownerId !== ownerId) {
      throw new ForbiddenException('Only owner can delete this storefront');
    }
    await this.storefrontRepository.remove(storefront);
  }

  async getStorefrontsByOwner(ownerId: string) {
    return this.storefrontRepository.find({
      where: { ownerId },
    });
  }
}
