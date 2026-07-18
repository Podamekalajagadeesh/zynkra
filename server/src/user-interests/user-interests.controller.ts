import { Controller, Get, Post, Delete, Body, UseGuards, Query, Param } from '@nestjs/common';
import { UserInterestsService, RecommendedContent } from './user-interests.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post as PostEntity } from '../posts/entities/post.entity';
import { Product } from '../marketplace/entities/product.entity';

class AddInterestDto {
  tagId: string;
}

@Controller('user-interests')
@UseGuards(JwtAuthGuard)
export class UserInterestsController {
  constructor(private readonly userInterestsService: UserInterestsService) {}

  @Get()
  async getUserInterests(
    @CurrentUser() user: User,
    @Query('limit') limit: string = '20',
  ) {
    const limitNumber = parseInt(limit, 10);
    return this.userInterestsService.getInterests(user, limitNumber);
  }

  @Post()
  async addInterest(
    @Body() addInterestDto: AddInterestDto,
    @CurrentUser() user: User,
  ) {
    return this.userInterestsService.addInterest(user, addInterestDto.tagId);
  }

  @Delete(':tagId')
  async removeInterest(
    @Param('tagId') tagId: string,
    @CurrentUser() user: User,
  ) {
    await this.userInterestsService.removeInterest(user, tagId);
    return { success: true };
  }

  @Get('recommendations/posts')
  async getPostRecommendations(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): Promise<RecommendedContent<PostEntity>> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.userInterestsService.getRecommendedPosts(user, pageNumber, limitNumber);
  }

  @Get('recommendations/products')
  async getProductRecommendations(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): Promise<RecommendedContent<Product>> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.userInterestsService.getRecommendedProducts(user, pageNumber, limitNumber);
  }

  @Get('similar')
  async getSimilarInterests(
    @CurrentUser() user: User,
    @Query('limit') limit: string = '10',
  ) {
    const limitNumber = parseInt(limit, 10);
    return this.userInterestsService.getUserSimilarInterests(user, limitNumber);
  }
}