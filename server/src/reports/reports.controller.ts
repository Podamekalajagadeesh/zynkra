import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';

@Controller('posts/:postId/report')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createReportDto: CreateReportDto,
  ) {
    const reporter = await this.usersService.findOneById(req.user.userId);
    if (!reporter) {
      throw new NotFoundException('Reporter not found');
    }

    const post = await this.postsService.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.reportsService.create(
      createReportDto.reason,
      reporter,
      post,
    );
  }
}