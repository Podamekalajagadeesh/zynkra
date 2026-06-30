import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fundraiser } from './entities/fundraiser.entity';
import { Donation } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from '../payments/payments.service';
import { CreateFundraiserDto } from './dto/create-fundraiser.dto';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class FundraisersService {
  constructor(
    @InjectRepository(Fundraiser)
    private readonly fundraiserRepository: Repository<Fundraiser>,
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(createFundraiserDto: CreateFundraiserDto, organizer: User): Promise<Fundraiser> {
    const fundraiser = this.fundraiserRepository.create({
      ...createFundraiserDto,
      organizer,
    });
    return this.fundraiserRepository.save(fundraiser);
  }

  async findAll(): Promise<Fundraiser[]> {
    return this.fundraiserRepository.find({ relations: ['organizer'] });
  }

  async findOne(id: string): Promise<Fundraiser> {
    return this.fundraiserRepository.findOne({ where: { id }, relations: ['organizer', 'donations', 'donations.donor'] });
  }

  async createDonation(
    fundraiserId: string,
    createDonationDto: CreateDonationDto,
    donor: User,
  ): Promise<Donation> {
    const fundraiser = await this.findOne(fundraiserId);
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      createDonationDto.amount * 100, // Stripe expects the amount in cents
      fundraiser.currency,
    );

    const donation = this.donationRepository.create({
      ...createDonationDto,
      donor,
      fundraiser,
      transactionId: paymentIntent.id,
    });

    fundraiser.currentAmount = Number(fundraiser.currentAmount) + Number(createDonationDto.amount);
    await this.fundraiserRepository.save(fundraiser);

    return this.donationRepository.save(donation);
  }
}