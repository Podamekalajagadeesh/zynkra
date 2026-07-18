import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { SponsoredPostsService } from './sponsored-posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from '../posts/posts.service';
import { CreateSponsoredPostDto } from './dto/create-sponsored-post.dto';

@Controller('sponsored-posts')
export class SponsoredPostsController {
  constructor(
    private readonly sponsoredPostsService: SponsoredPostsService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async create(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createSponsoredPostDto: CreateSponsoredPostDto,
  ) {
    const post = await this.postsService.findOne(postId);
    return this.sponsoredPostsService.create(
      req.user,
      post,
      createSponsoredPostDto.budget,
      new Date(createSponsoredPostDto.expiresAt),
    );
  }
}