import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenGatedContent } from './entities/token-gated-content.entity';
import { TokenGatedGroup } from './entities/token-gated-group.entity';
import { User } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TokenGatedContentService {
  constructor(
    @InjectRepository(TokenGatedContent)
    private tokenGatedContentRepository: Repository<TokenGatedContent>,
    @InjectRepository(TokenGatedGroup)
    private tokenGatedGroupRepository: Repository<TokenGatedGroup>,
    private readonly httpService: HttpService,
  ) {}

  async checkTokenBalance(
    walletAddress: string,
    contractAddress: string,
  ): Promise<bigint> {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/getTokenBalances?owner=${walletAddress}&contractAddresses[]=${contractAddress}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const tokenBalance = response.data.tokenBalances[0].tokenBalance;

    if (tokenBalance) {
      return BigInt(tokenBalance);
    }

    return BigInt(0);
  }

  async hasAccess(user: User, post: any): Promise<boolean> {
    if (!post.tokenGated) {
      return true;
    }

    if (!user.walletAddress) {
      return false;
    }

    const balance = await this.checkTokenBalance(
      user.walletAddress,
      post.contractAddress,
    );
    const requiredBalance = BigInt(post.requiredTokenBalance);
    return balance >= requiredBalance;
  }

  async createContent(creator: User, name: string, description: string, tokenAddress: string, minTokenBalance: number): Promise<TokenGatedContent> {
    const content = this.tokenGatedContentRepository.create({
      creator,
      name,
      description,
      tokenAddress,
      minTokenBalance,
    });
    return this.tokenGatedContentRepository.save(content);
  }

  async createGroup(creator: User, name: string, description: string, tokenAddress: string, minTokenBalance: number): Promise<TokenGatedGroup> {
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
    return this.tokenGatedContentRepository.findOne({ where: { id: contentId } });
  }

  async getGroup(groupId: string): Promise<TokenGatedGroup | null> {
    return this.tokenGatedGroupRepository.findOne({ where: { id: groupId }, relations: ['members'] });
  }

  async joinGroup(user: User, group: TokenGatedGroup): Promise<TokenGatedGroup> {
    if (group.members.some((member) => member.id === user.id)) {
      return group;
    }

    group.members.push(user);
    return this.tokenGatedGroupRepository.save(group);
  }
}