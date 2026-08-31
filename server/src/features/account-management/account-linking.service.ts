import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LinkedAccount, LinkedAccountProvider } from './entities/linked-account.entity';
import { LinkAccountDto, UnlinkAccountDto, SetPrimaryAccountDto } from './dto/link-account.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AccountLinkingService {
  private readonly logger = new Logger(AccountLinkingService.name);

  constructor(
    @InjectRepository(LinkedAccount)
    private linkedAccountRepository: Repository<LinkedAccount>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async linkAccount(userId: string, linkAccountDto: LinkAccountDto): Promise<LinkedAccount> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if this provider account is already linked
    const existingLink = await this.linkedAccountRepository.findOne({
      where: {
        user: { id: userId },
        provider: linkAccountDto.provider,
        externalUserId: linkAccountDto.externalUserId,
      },
    });

    if (existingLink) {
      throw new ConflictException('This account is already linked');
    }

    // If this is the primary account, unset any existing primary
    if (linkAccountDto.isPrimary) {
      const currentPrimary = await this.linkedAccountRepository.findOne({
        where: {
          user: { id: userId },
          isPrimary: true,
        },
      });

      if (currentPrimary) {
        currentPrimary.isPrimary = false;
        await this.linkedAccountRepository.save(currentPrimary);
      }
    }

    const linkedAccount = this.linkedAccountRepository.create({
      user,
      userId,
      provider: linkAccountDto.provider,
      externalUserId: linkAccountDto.externalUserId,
      displayName: linkAccountDto.displayName,
      email: linkAccountDto.email,
      profilePictureUrl: linkAccountDto.profilePictureUrl,
      isPrimary: linkAccountDto.isPrimary || false,
      isVerified: true,
      metadata: linkAccountDto.metadata,
      lastUsedAt: new Date(),
    });

    const saved = await this.linkedAccountRepository.save(linkedAccount);

    this.logger.log(`Account linked: ${linkAccountDto.provider} for user ${userId}`);

    await this.notificationsService.createNotification({
      userId,
      title: 'Account Linked',
      message: `Your ${linkAccountDto.provider} account has been linked successfully`,
      type: 'account_linked',
      metadata: { provider: linkAccountDto.provider },
    } as any);

    return saved;
  }

  async unlinkAccount(userId: string, linkedAccountId: string): Promise<void> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });

    if (!linkedAccount || linkedAccount.userId !== userId) {
      throw new NotFoundException('Linked account not found or you do not have permission to unlink it');
    }

    if (linkedAccount.isPrimary) {
      throw new BadRequestException('Cannot unlink your primary account');
    }

    await this.linkedAccountRepository.remove(linkedAccount);

    this.logger.log(`Account unlinked: ${linkedAccount.provider} for user ${userId}`);

    await this.notificationsService.createNotification({
      userId,
      title: 'Account Unlinked',
      message: `Your ${linkedAccount.provider} account has been unlinked`,
      type: 'account_unlinked',
      metadata: { provider: linkedAccount.provider },
    } as any);
  }

  async setPrimaryAccount(userId: string, linkedAccountId: string): Promise<LinkedAccount> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });

    if (!linkedAccount || linkedAccount.userId !== userId) {
      throw new NotFoundException('Linked account not found');
    }

    // Unset current primary
    const currentPrimary = await this.linkedAccountRepository.findOne({
      where: {
        user: { id: userId },
        isPrimary: true,
      },
    });

    if (currentPrimary) {
      currentPrimary.isPrimary = false;
      await this.linkedAccountRepository.save(currentPrimary);
    }

    // Set new primary
    linkedAccount.isPrimary = true;
    linkedAccount.lastUsedAt = new Date();
    const saved = await this.linkedAccountRepository.save(linkedAccount);

    this.logger.log(`Primary account changed to ${linkedAccount.provider} for user ${userId}`);

    return saved;
  }

  async getUserLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    return this.linkedAccountRepository.find({
      where: { user: { id: userId }, isActive: true },
      order: { isPrimary: 'DESC', connectedAt: 'DESC' },
    });
  }

  async getLinkedAccount(linkedAccountId: string): Promise<LinkedAccount> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });
    if (!linkedAccount) {
      throw new NotFoundException('Linked account not found');
    }
    return linkedAccount;
  }

  async getPrimaryLinkedAccount(userId: string): Promise<LinkedAccount | null> {
    return this.linkedAccountRepository.findOne({
      where: {
        user: { id: userId },
        isPrimary: true,
        isActive: true,
      },
    });
  }

  async getLinkedAccountByProvider(userId: string, provider: LinkedAccountProvider): Promise<LinkedAccount | null> {
    return this.linkedAccountRepository.findOne({
      where: {
        user: { id: userId },
        provider,
        isActive: true,
      },
    });
  }

  async updateLastUsed(linkedAccountId: string): Promise<void> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });
    if (linkedAccount) {
      linkedAccount.lastUsedAt = new Date();
      await this.linkedAccountRepository.save(linkedAccount);
    }
  }

  async deactivateLinkedAccount(linkedAccountId: string): Promise<LinkedAccount> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });
    if (!linkedAccount) {
      throw new NotFoundException('Linked account not found');
    }

    if (linkedAccount.isPrimary) {
      throw new BadRequestException('Cannot deactivate your primary account');
    }

    linkedAccount.isActive = false;
    return this.linkedAccountRepository.save(linkedAccount);
  }

  async reactivateLinkedAccount(linkedAccountId: string): Promise<LinkedAccount> {
    const linkedAccount = await this.linkedAccountRepository.findOne({ where: { id: linkedAccountId } });
    if (!linkedAccount) {
      throw new NotFoundException('Linked account not found');
    }

    linkedAccount.isActive = true;
    return this.linkedAccountRepository.save(linkedAccount);
  }
}
