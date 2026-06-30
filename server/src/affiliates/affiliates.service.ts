import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { nanoid } from 'nanoid';
import { AffiliateLink } from './entities/affiliate-link.entity';
import { AffiliateClick } from './entities/affiliate-click.entity';
import { AffiliateConversion } from './entities/affiliate-conversion.entity';
import { User } from '../users/entities/user.entity';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(AffiliateLink)
    private readonly affiliateLinkRepository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateClick)
    private readonly affiliateClickRepository: Repository<AffiliateClick>,
    @InjectRepository(AffiliateConversion)
    private readonly affiliateConversionRepository: Repository<AffiliateConversion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createAffiliateLink(user: User, dto: CreateAffiliateLinkDto): Promise<AffiliateLink> {
    const slug = nanoid(8);
    
    const link = this.affiliateLinkRepository.create({
      name: dto.name,
      destinationUrl: dto.destinationUrl,
      slug,
      userId: user.id,
      commissionRate: dto.commissionRate || 10.0,
    });

    return this.affiliateLinkRepository.save(link);
  }

  async getUserAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    return this.affiliateLinkRepository.find({
      where: { userId },
      relations: ['clicks', 'conversions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAffiliateLinkStats(userId: string) {
    const links = await this.affiliateLinkRepository.find({
      where: { userId },
      relations: ['clicks', 'conversions'],
    });

    let totalClicks = 0;
    let totalConversions = 0;
    let totalEarnings = 0;
    let pendingEarnings = 0;

    links.forEach(link => {
      totalClicks += link.clickCount;
      totalConversions += link.conversionCount;
      totalEarnings += link.totalEarnings;
      
      link.conversions.forEach(conversion => {
        if (conversion.status === 'pending') {
          pendingEarnings += conversion.commissionEarned;
        }
      });
    });

    return {
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalEarnings,
      pendingEarnings,
      availableEarnings: totalEarnings - pendingEarnings,
    };
  }

  async trackClick(slug: string, ipAddress: string, userAgent?: string, referrer?: string): Promise<string> {
    const link = await this.affiliateLinkRepository.findOne({ where: { slug } });
    
    if (!link) {
      throw new NotFoundException('Affiliate link not found');
    }

    const click = this.affiliateClickRepository.create({
      affiliateLinkId: link.id,
      ipAddress,
      userAgent,
      referrer,
    });

    await this.affiliateClickRepository.save(click);
    
    link.clickCount += 1;
    await this.affiliateLinkRepository.save(link);

    return link.destinationUrl;
  }

  async getLinkPerformance(linkId: string, userId: string) {
    const link = await this.affiliateLinkRepository.findOne({
      where: { id: linkId, userId },
      relations: ['clicks', 'conversions'],
    });

    if (!link) {
      throw new NotFoundException('Affiliate link not found');
    }

    const clicksByDay = await this.affiliateClickRepository
      .createQueryBuilder('click')
      .select("DATE(click.clickedAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("click.affiliateLinkId = :linkId", { linkId })
      .groupBy("DATE(click.clickedAt)")
      .orderBy("date", "DESC")
      .limit(30)
      .getRawMany();

    const conversionsByDay = await this.affiliateConversionRepository
      .createQueryBuilder('conversion')
      .select("DATE(conversion.convertedAt)", "date")
      .addSelect("SUM(conversion.commissionEarned)", "earnings")
      .addSelect("COUNT(*)", "count")
      .where("conversion.affiliateLinkId = :linkId", { linkId })
      .groupBy("DATE(conversion.convertedAt)")
      .orderBy("date", "DESC")
      .limit(30)
      .getRawMany();

    const topCountries = await this.affiliateClickRepository
      .createQueryBuilder('click')
      .select("click.country", "country")
      .addSelect("COUNT(*)", "count")
      .where("click.affiliateLinkId = :linkId", { linkId })
      .groupBy("click.country")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    return {
      link,
      clicksByDay,
      conversionsByDay,
      topCountries,
    };
  }

  async deleteAffiliateLink(linkId: string, userId: string): Promise<void> {
    const result = await this.affiliateLinkRepository.delete({ id: linkId, userId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Affiliate link not found');
    }
  }
}