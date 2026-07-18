import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceLocation, InterstellarMessage, SpaceLocationType } from './entities/space-location.entity';

@Injectable()
export class InterstellarConnectionService {
  constructor(
    @InjectRepository(SpaceLocation)
    private readonly locationRepository: Repository<SpaceLocation>,
    @InjectRepository(InterstellarMessage)
    private readonly messageRepository: Repository<InterstellarMessage>,
  ) {
    this.initializeDefaultLocations();
  }

  private async initializeDefaultLocations() {
    const count = await this.locationRepository.count();
    if (count === 0) {
      const defaultLocations = [
        {
          name: 'International Space Station (ISS)',
          type: SpaceLocationType.SPACE_STATION,
          description: 'Low Earth orbit scientific laboratory',
          coordinates: 'LEO: 400 km',
          population: 7,
          latencyMs: 20,
        },
        {
          name: 'Lunar Gateway',
          type: SpaceLocationType.LUNAR_BASE,
          description: 'Lunar orbital outpost',
          coordinates: 'Lunar Orbit: 3,844 km',
          population: 4,
          latencyMs: 1300,
        },
        {
          name: 'Mars Base Alpha',
          type: SpaceLocationType.MARS_COLONY,
          description: 'First permanent human settlement on Mars',
          coordinates: 'Mars Elysium Planitia',
          population: 24,
          latencyMs: 126000,
        },
      ];

      for (const locData of defaultLocations) {
        const loc = this.locationRepository.create(locData);
        await this.locationRepository.save(loc);
      }
    }
  }

  async getAllLocations() {
    return this.locationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getLocationById(id: string) {
    const loc = await this.locationRepository.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');
    return loc;
  }

  async sendMessage(
    senderId: string,
    data: {
      recipientId?: string;
      senderLocationId?: string;
      recipientLocationId?: string;
      content: string;
      isBroadcast?: boolean;
    },
  ) {
    const msg = this.messageRepository.create({
      ...data,
      senderId,
      sentAt: new Date(),
    });

    const senderLoc = data.senderLocationId
      ? await this.locationRepository.findOne({ where: { id: data.senderLocationId } })
      : null;
    const recipientLoc = data.recipientLocationId
      ? await this.locationRepository.findOne({ where: { id: data.recipientLocationId } })
      : null;

    if (senderLoc && recipientLoc) {
      msg.travelTimeMs = senderLoc.latencyMs + recipientLoc.latencyMs;
    }

    return this.messageRepository.save(msg);
  }

  async getMessages(
    filters: {
      userId?: string;
      senderId?: string;
      recipientId?: string;
      isBroadcast?: boolean;
    } = {},
  ) {
    const query = this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.senderLocation', 'senderLocation')
      .leftJoinAndSelect('msg.recipientLocation', 'recipientLocation')
      .orderBy('msg.createdAt', 'DESC');

    if (filters.senderId) {
      query.andWhere('msg.senderId = :senderId', { senderId: filters.senderId });
    }
    if (filters.recipientId) {
      query.andWhere('msg.recipientId = :recipientId', { recipientId: filters.recipientId });
    }
    if (filters.isBroadcast !== undefined) {
      query.andWhere('msg.isBroadcast = :isBroadcast', { isBroadcast: filters.isBroadcast });
    }

    return query.getMany();
  }

  async createLocation(data: Partial<SpaceLocation>) {
    const loc = this.locationRepository.create(data);
    return this.locationRepository.save(loc);
  }
}
