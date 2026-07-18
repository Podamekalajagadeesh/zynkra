import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryStandard, StandardCategory, ComplianceStatus } from './entities/regulatory-standard.entity';
import { ComplianceReport } from './entities/compliance-report.entity';

@Injectable()
export class GlobalRegulatoryService {
  constructor(
    @InjectRepository(RegulatoryStandard)
    private readonly standardRepository: Repository<RegulatoryStandard>,
    @InjectRepository(ComplianceReport)
    private readonly reportRepository: Repository<ComplianceReport>,
  ) {
    this.seedInitialStandards();
  }

  private async seedInitialStandards() {
    const count = await this.standardRepository.count();
    if (count === 0) {
      const standards = [
        {
          name: 'Neural Interface Safety Standard (NISS-2056)',
          jurisdiction: 'Global',
          category: StandardCategory.SAFETY,
          description: 'International standards for neural interface device safety and reliability',
          requirements: 'Mandatory safety testing, emergency shutoff mechanisms, continuous monitoring',
          applicableRegions: ['Global'],
        },
        {
          name: 'General Neural Data Protection Regulation (GNDPR)',
          jurisdiction: 'EU',
          category: StandardCategory.PRIVACY,
          description: 'EU regulations for neural data privacy and user rights',
          requirements: 'Explicit consent, data minimization, right to erasure, data portability',
          applicableRegions: ['EU', 'EEA'],
        },
        {
          name: 'Neural Content Governance Act (NCGA)',
          jurisdiction: 'US',
          category: StandardCategory.GOVERNANCE,
          description: 'US regulations governing neural content moderation and misinformation',
          requirements: 'Transparent moderation policies, appeal processes, content labeling',
          applicableRegions: ['US'],
        },
        {
          name: 'Global Neural Ethics Charter (GNEC)',
          jurisdiction: 'Global',
          category: StandardCategory.ETHICS,
          description: 'Ethical framework for neural technology development and use',
          requirements: 'Human dignity, non-discrimination, informed consent, accountability',
          applicableRegions: ['Global'],
        },
      ];
      for (const std of standards) {
        await this.standardRepository.save(this.standardRepository.create(std));
      }
    }
  }

  async getAllStandards(category?: StandardCategory) {
    const where = category ? { category } : {};
    return this.standardRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async getStandardById(id: string) {
    return this.standardRepository.findOne({ where: { id } });
  }

  async getAllComplianceReports() {
    return this.reportRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['standard'],
    });
  }

  async getComplianceReportById(id: string) {
    return this.reportRepository.findOne({
      where: { id },
      relations: ['standard'],
    });
  }

  async createComplianceReport(data: Partial<ComplianceReport>) {
    const report = this.reportRepository.create(data);
    return this.reportRepository.save(report);
  }

  async updateComplianceReport(id: string, data: Partial<ComplianceReport>) {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    Object.assign(report, data);
    return this.reportRepository.save(report);
  }

  async getComplianceStats() {
    const [totalStandards, totalReports] = await Promise.all([
      this.standardRepository.count(),
      this.reportRepository.count(),
    ]);

    const statusCounts = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.status')
      .getRawMany();

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStandards,
      totalReports,
      statusCounts: {
        [ComplianceStatus.COMPLIANT]: statusMap[ComplianceStatus.COMPLIANT] || 0,
        [ComplianceStatus.PARTIAL]: statusMap[ComplianceStatus.PARTIAL] || 0,
        [ComplianceStatus.NON_COMPLIANT]: statusMap[ComplianceStatus.NON_COMPLIANT] || 0,
        [ComplianceStatus.PENDING]: statusMap[ComplianceStatus.PENDING] || 0,
      },
    };
  }
}
