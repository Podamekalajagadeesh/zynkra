import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Get,
  Delete,
  Patch,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const user = await this.usersService.findOneById(req.user.userId);
    const post = await this.postsService.findOne(postId);
    return this.commentsService.create(
      createCommentDto.content,
      user,
      post,
      createCommentDto.parentId,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findByPost(@Request() req, @Param('postId') postId: string) {
    return this.commentsService.findByPost(postId, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async delete(@Request() req, @Param('commentId') commentId: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.commentsService.delete(commentId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId/pin')
  async togglePin(@Request() req, @Param('commentId') commentId: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.commentsService.togglePin(commentId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId/lock')
  async toggleLock(@Request() req, @Param('commentId') commentId: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.commentsService.toggleLock(commentId, user);
  }
}