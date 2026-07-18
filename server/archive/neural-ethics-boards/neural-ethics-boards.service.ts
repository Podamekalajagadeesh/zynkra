import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthicsBoard, BoardRegion } from './entities/ethics-board.entity';
import { EthicsAudit, AuditStatus } from './entities/ethics-audit.entity';

@Injectable()
export class NeuralEthicsBoardsService {
  constructor(
    @InjectRepository(EthicsBoard)
    private readonly boardRepository: Repository<EthicsBoard>,
    @InjectRepository(EthicsAudit)
    private readonly auditRepository: Repository<EthicsAudit>,
  ) {
    this.initializeDefaultBoards();
  }

  private async initializeDefaultBoards() {
    const count = await this.boardRepository.count();
    if (count === 0) {
      const defaultBoards = [
        {
          name: 'Global Neural Ethics Board',
          region: BoardRegion.GLOBAL,
          description: 'Oversees global neural technology standards',
          focusAreas: ['safety', 'privacy', 'equity'],
        },
        {
          name: 'European Neural Ethics Board',
          region: BoardRegion.EUROPE,
          description: 'Enforces EU-specific neural ethics regulations',
          focusAreas: ['GDPR compliance', 'data rights'],
        },
        {
          name: 'North American Neural Ethics Board',
          region: BoardRegion.NORTH_AMERICA,
          description: 'Oversees North American neural technology practices',
          focusAreas: ['consumer protection', 'transparency'],
        },
      ];

      for (const boardData of defaultBoards) {
        const board = this.boardRepository.create(boardData);
        await this.boardRepository.save(board);
      }
    }
  }

  async getAllBoards() {
    return this.boardRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getBoardById(id: string) {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async createBoard(data: Partial<EthicsBoard>) {
    const board = this.boardRepository.create(data);
    return this.boardRepository.save(board);
  }

  async updateBoard(id: string, data: Partial<EthicsBoard>) {
    const board = await this.getBoardById(id);
    Object.assign(board, data);
    return this.boardRepository.save(board);
  }

  async getAllAudits() {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['board'],
    });
  }

  async getAuditById(id: string) {
    const audit = await this.auditRepository.findOne({
      where: { id },
      relations: ['board'],
    });
    if (!audit) throw new NotFoundException('Audit not found');
    return audit;
  }

  async createAudit(data: Partial<EthicsAudit>) {
    const audit = this.auditRepository.create(data);
    return this.auditRepository.save(audit);
  }

  async updateAudit(id: string, data: Partial<EthicsAudit>) {
    const audit = await this.getAuditById(id);
    Object.assign(audit, data);
    return this.auditRepository.save(audit);
  }

  async getStats() {
    const [totalBoards, totalAudits, completedAudits] = await Promise.all([
      this.boardRepository.count(),
      this.auditRepository.count(),
      this.auditRepository.count({ where: { status: AuditStatus.COMPLETED } }),
    ]);
    return { totalBoards, totalAudits, completedAudits };
  }
}
