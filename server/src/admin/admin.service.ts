import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly postsService: PostsService,
  ) {}

  async getReports(take: number, skip: number) {
    return this.reportsService.findAll(take, skip);
  }

  async getReport(id: string) {
    return this.reportsService.findOne(id);
  }

  async deletePost(id: string) {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new Error('Post not found');
    }
    await this.postsService.remove(id, { userId: 'admin', role: 'admin' });
  }

  async dismissReport(id: string) {
    return this.reportsService.remove(id);
  }
}