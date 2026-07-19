import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { verifyMessage } from 'ethers';
import { User } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { SetNftPfpDto } from './dto/set-nft-pfp.dto';
import { firstValueFrom } from 'rxjs';

export interface WalletBalanceSummary {
  walletBalance: number;
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

  async credit(userId: string, amount: number, metadata?: Record<string, any>): Promise<WalletBalanceSummary> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentBalance = Number(user.walletBalance ?? 0);
    user.walletBalance = currentBalance + Number(amount);
    await this.usersRepository.save(user);

    return { walletBalance: Number(user.walletBalance ?? 0) };
  }

  async debit(userId: string, amount: number, metadata?: Record<string, any>): Promise<WalletBalanceSummary> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentBalance = Number(user.walletBalance ?? 0);
    user.walletBalance = Math.max(0, currentBalance - Number(amount));
    await this.usersRepository.save(user);

    return { walletBalance: Number(user.walletBalance ?? 0) };
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
