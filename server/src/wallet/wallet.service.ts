import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async connectWallet(user: User, walletAddress: string): Promise<User> {
    user.walletAddress = walletAddress;
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

  async setNftPfp(user: User, setNftPfpDto: SetNftPfpDto): Promise<User> {
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