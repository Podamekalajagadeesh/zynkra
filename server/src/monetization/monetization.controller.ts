import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

@Controller('monetization')
export class MonetizationController {
  constructor(
    private readonly monetizationService: MonetizationService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get('badges')
  async getBadges() {
    return this.monetizationService.getBadges();
  }

  @Get('gifts')
  async getGifts() {
    return this.monetizationService.getGifts();
  }

  @UseGuards(JwtAuthGuard)
  @Post('gifts/send')
  async sendGift(
    @Request() req,
    @Body() body: { recipientId: string; giftId: string; postId?: string; commentId?: string; message?: string },
  ) {
    const sender = await this.usersService.findOneById(req.user.userId);
    const recipient = await this.usersService.findOneById(body.recipientId);
    const gift = await this.monetizationService.getGifts().then(gifts => gifts.find(g => g.id === body.giftId));
    const post = body.postId ? await this.postsService.findOne(body.postId) : undefined;
    const comment = body.commentId ? await this.commentsService.findOne(body.commentId) : undefined;

    return this.monetizationService.sendGift(sender, recipient, gift, post, comment, body.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('badges/assign')
  async assignBadge(@Request() req, @Body() body: { badgeId: string }) {
    const user = await this.usersService.findOneById(req.user.userId);
    const badge = await this.monetizationService.getBadges().then(badges => badges.find(b => b.id === body.badgeId));
    return this.monetizationService.assignBadge(user, badge);
  }
}