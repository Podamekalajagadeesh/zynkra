import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { InviteCode } from './invite-code.entity';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class InviteCodesService {
  constructor(
    @InjectRepository(InviteCode)
    private readonly inviteCodesRepository: Repository<InviteCode>,
  ) {}

  private generateCodeString(): string {
    const bytes = randomBytes(8);
    let code = '';
    for (const byte of bytes) {
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
    return code;
  }

  async generateCode(
    createdById?: string,
    opts: { maxUses?: number; expiresInDays?: number } = {},
  ): Promise<InviteCode> {
    const { maxUses = 1, expiresInDays } = opts;

    let code: string;
    let existing: InviteCode | null;
    do {
      code = this.generateCodeString();
      existing = await this.inviteCodesRepository.findOne({ where: { code } });
    } while (existing);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.inviteCodesRepository.save(
      this.inviteCodesRepository.create({ code, createdById, maxUses, expiresAt }),
    );
  }

  async findByCode(code: string): Promise<InviteCode | null> {
    return this.inviteCodesRepository.findOne({ where: { code } });
  }

  isUsable(invite: InviteCode | null): boolean {
    if (!invite) return false;
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return false;
    return invite.uses < invite.maxUses;
  }

  async consume(code: string): Promise<boolean> {
    const invite = await this.findByCode(code);
    if (!this.isUsable(invite)) return false;

    await this.inviteCodesRepository.update(invite!.id, { uses: invite!.uses + 1 });
    return true;
  }

  async list(): Promise<InviteCode[]> {
    return this.inviteCodesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.inviteCodesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Invite code not found');
    }
  }
}
