import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { verifyMessage } from 'ethers';
import { User } from '../users/entities/user.entity';
import { LedgerEntry, LedgerEntryType } from './entities/ledger-entry.entity';
import { HttpService } from '@nestjs/axios';
import { SetNftPfpDto } from './dto/set-nft-pfp.dto';
import { firstValueFrom } from 'rxjs';

export interface WalletBalanceSummary {
  walletBalance: number;
}

/** Optional tagging for a ledger movement so callers can classify entries. */
export interface WalletMovementOptions {
  purpose?: string;
  type?: LedgerEntryType;
  reference?: string | null;
  currency?: string;
  metadata?: Record<string, any>;
}

type AlchemyNftResponse = {
  ownedNfts: Array<{
    contract: { address: string };
    id: { tokenId: string };
  }>;
};

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
  ) {}

  /** The message the user must sign to prove ownership of a wallet before linking it. */
  buildLinkMessage(userId: string, walletAddress: string, nonce: string): string {
    return [
      'Zynkra wallet link request.',
      `Account: ${userId}`,
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
    ].join('\n');
  }

  async connectWallet(
    userId: string,
    walletAddress: string,
    signature: string,
    nonce: string | undefined,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!nonce) {
      throw new BadRequestException(
        'No link challenge found. Request GET /wallet/connect/challenge first.',
      );
    }

    // Verify the signature recovers to the wallet being linked.
    const message = this.buildLinkMessage(userId, walletAddress, nonce);
    let recovered: string;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      throw new UnauthorizedException('Invalid wallet signature');
    }
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedException(
        'Signature does not match the wallet address being linked',
      );
    }

    // A wallet may only be linked to one account.
    const existing = await this.usersRepository.findOne({
      where: { walletAddress },
    });
    if (existing && existing.id !== user.id) {
      throw new BadRequestException(
        'This wallet is already linked to another account',
      );
    }

    user.walletAddress = walletAddress;
    return this.usersRepository.save(user);
  }

  async disconnectWallet(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.walletAddress = null;
    // Clear NFT PFP too — it was verified against the disconnected wallet.
    user.nftPfpUrl = null;
    user.nftPfpContractAddress = null;
    user.nftPfpTokenId = null;
    return this.usersRepository.save(user);
  }

  async getBalance(userId: string): Promise<WalletBalanceSummary> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      walletBalance: Number(user.walletBalance ?? 0),
    };
  }

  async credit(
    userId: string,
    amount: number,
    options: WalletMovementOptions = {},
  ): Promise<WalletBalanceSummary> {
    return this.applyMovement(userId, Number(amount), {
      type: options.type ?? 'earning',
      ...options,
    });
  }

  async debit(
    userId: string,
    amount: number,
    options: WalletMovementOptions = {},
  ): Promise<WalletBalanceSummary> {
    return this.applyMovement(userId, -Math.abs(Number(amount)), {
      type: options.type ?? 'payout',
      ...options,
    });
  }

  /**
   * Atomically move `delta` (signed) against a user's balance and record a
   * matching ledger entry in the same transaction. A pessimistic row lock on
   * the user prevents concurrent movements (e.g. two payout requests) from
   * racing the balance. A debit that would overdraw the balance throws — it is
   * never silently capped, which previously let a payout record more than it
   * actually debited.
   */
  private async applyMovement(
    userId: string,
    delta: number,
    options: WalletMovementOptions,
  ): Promise<WalletBalanceSummary> {
    if (!Number.isFinite(delta)) {
      throw new BadRequestException('Invalid wallet movement amount');
    }

    return this.dataSource.transaction(async (manager) => {
      // Query builder (not findOne) so eager relations like `reputation` are
      // not LEFT JOINed — Postgres rejects FOR UPDATE on the nullable side of
      // an outer join, which broke every wallet movement.
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: userId })
        .getOne();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const currentBalance = Number(user.walletBalance ?? 0);
      const nextBalance = currentBalance + delta;
      if (nextBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      user.walletBalance = nextBalance;
      await manager.save(User, user);

      const entry = manager.create(LedgerEntry, {
        user: { id: userId } as User,
        type: options.type ?? (delta >= 0 ? 'earning' : 'payout'),
        amount: delta,
        balanceAfter: nextBalance,
        currency: options.currency ?? 'usd',
        reference: options.reference ?? null,
        purpose: options.purpose ?? null,
        metadata: options.metadata ?? null,
      });
      await manager.save(LedgerEntry, entry);

      return { walletBalance: nextBalance };
    });
  }

  async getLedger(userId: string, limit = 100): Promise<LedgerEntry[]> {
    return this.ledgerRepository.find({
      where: { user: { id: userId } as User },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getNfts(walletAddress: string) {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/getNFTs?owner=${walletAddress}`;
    const response = await firstValueFrom(
      this.httpService.get<AlchemyNftResponse>(url),
    );
    return response.data;
  }

  async setNftPfp(userId: string, setNftPfpDto: SetNftPfpDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.walletAddress) {
      throw new BadRequestException('Connect a wallet first');
    }

    const { nftPfpUrl, nftPfpContractAddress, nftPfpTokenId } = setNftPfpDto;

    const nfts = await this.getNfts(user.walletAddress);
    const ownedNfts = nfts.ownedNfts;

    const isOwner = ownedNfts.some(
      (nft) =>
        nft.contract.address.toLowerCase() === nftPfpContractAddress.toLowerCase() &&
        nft.id.tokenId === nftPfpTokenId,
    );

    if (!isOwner) {
      throw new UnauthorizedException('You do not own this NFT.');
    }

    user.nftPfpUrl = nftPfpUrl;
    user.nftPfpContractAddress = nftPfpContractAddress;
    user.nftPfpTokenId = nftPfpTokenId;

    return this.usersRepository.save(user);
  }
}
