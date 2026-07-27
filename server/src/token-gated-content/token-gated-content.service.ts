import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenGatedContent } from './entities/token-gated-content.entity';
import { TokenGatedGroup } from './entities/token-gated-group.entity';
import { User } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/** Supported blockchain networks for token gating */
const SUPPORTED_CHAINS = [
  { name: 'Ethereum', chainId: 1, alchemyKey: 'eth-mainnet' },
  { name: 'Polygon', chainId: 137, alchemyKey: 'polygon-mainnet' },
  { name: 'Base', chainId: 8453, alchemyKey: 'base-mainnet' },
  { name: 'Arbitrum', chainId: 42161, alchemyKey: 'arb-mainnet' },
  { name: 'Optimism', chainId: 10, alchemyKey: 'opt-mainnet' },
  { name: 'Zora', chainId: 7777777, alchemyKey: 'zora-mainnet' },
];

const TIERS = ['basic', 'premium', 'vip', 'whale'] as const;
const MIN_BALANCES: Record<string, number> = {
  basic: 1,
  premium: 10,
  vip: 100,
  whale: 1000,
};

@Injectable()
export class TokenGatedContentService {
  private readonly alchemyApiKey: string;

  constructor(
    @InjectRepository(TokenGatedContent)
    private tokenGatedContentRepository: Repository<TokenGatedContent>,
    @InjectRepository(TokenGatedGroup)
    private tokenGatedGroupRepository: Repository<TokenGatedGroup>,
    private readonly httpService: HttpService,
  ) {
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
  }

  getSupportedChains() {
    return SUPPORTED_CHAINS;
  }

  getTiers() {
    return TIERS.map(t => ({ name: t, minTokens: MIN_BALANCES[t] }));
  }

  async checkTokenBalance(
    walletAddress: string,
    contractAddress: string,
    chainId: number = 1,
  ): Promise<bigint> {
    const chain = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
    if (!chain) throw new BadRequestException(`Chain ${chainId} not supported`);

    // For ERC-721 (NFT) gating
    if (contractAddress.toLowerCase() === 'erc721') {
      const nftData = await this.checkNftBalance(walletAddress, contractAddress);
      return nftData;
    }

    // For ERC-20 token gating
    try {
      const url = `https://${chain.alchemyKey}.g.alchemy.com/v2/${this.alchemyApiKey}/getTokenBalances?owner=${walletAddress}&contractAddresses[]=${contractAddress}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const tokenBalance = response.data.tokenBalances?.[0]?.tokenBalance;
      return tokenBalance ? BigInt(tokenBalance) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }

  private async checkNftBalance(walletAddress: string, contractAddress: string): Promise<bigint> {
    try {
      const url = `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}/getNFTs?owner=${walletAddress}&contractAddresses[]=${contractAddress}`;
      const response = await firstValueFrom(this.httpService.get(url));
      return BigInt(response.data.totalCount || 0);
    } catch {
      return BigInt(0);
    }
  }

  async hasAccess(user: User, content: any): Promise<boolean> {
    if (!content.isGated) return true;
    if (!user.walletAddress) return false;

    const balance = await this.checkTokenBalance(
      user.walletAddress,
      content.contractAddress || content.tokenAddress,
      content.chainId || 1,
    );
    const requiredBalance = BigInt(content.requiredTokenBalance || content.minTokenBalance || 1);
    return balance >= requiredBalance;
  }

  async verifyTierAccess(user: User, tier: string): Promise<{
    hasAccess: boolean;
    tier: string;
    balance: string;
    requiredBalance: number;
  }> {
    if (!TIERS.includes(tier as any)) throw new BadRequestException(`Invalid tier: ${tier}`);
    if (!user.walletAddress) return { hasAccess: false, tier, balance: '0', requiredBalance: MIN_BALANCES[tier] };

    const requiredBalance = MIN_BALANCES[tier];
    const balance = await this.checkTokenBalance(user.walletAddress, user.publicKey || '', 1);
    const hasAccess = balance >= BigInt(requiredBalance);

    return {
      hasAccess,
      tier,
      balance: balance.toString(),
      requiredBalance,
    };
  }

  async createContent(
    creator: User,
    name: string,
    description: string,
    tokenAddress: string,
    minTokenBalance: number,
    chainId: number = 1,
    tier: string = 'basic',
  ): Promise<TokenGatedContent> {
    const content = this.tokenGatedContentRepository.create({
      creator,
      name,
      description,
      tokenAddress,
      minTokenBalance,
      chainId,
      tier,
    });
    return this.tokenGatedContentRepository.save(content);
  }

  async createGroup(
    creator: User,
    name: string,
    description: string,
    tokenAddress: string,
    minTokenBalance: number,
  ): Promise<TokenGatedGroup> {
    const group = this.tokenGatedGroupRepository.create({
      creator,
      name,
      description,
      tokenAddress,
      minTokenBalance,
    });
    return this.tokenGatedGroupRepository.save(group);
  }

  async getContent(contentId: string): Promise<TokenGatedContent | null> {
    return this.tokenGatedContentRepository.findOne({ where: { id: contentId }, relations: ['creator'] });
  }

  async getGroup(groupId: string): Promise<TokenGatedGroup | null> {
    return this.tokenGatedGroupRepository.findOne({ where: { id: groupId }, relations: ['members'] });
  }

  async joinGroup(user: User, group: TokenGatedGroup): Promise<TokenGatedGroup> {
    if (!group.members) group.members = [];
    if (group.members.some((member: any) => member.id === user.id)) return group;
    group.members.push(user);
    return this.tokenGatedGroupRepository.save(group);
  }
}
