import { Injectable, NotFoundException } from '@nestjs/common';
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

  async deletePost(id: string, actingAdminId: string) {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    // AdminGuard has already established the caller holds the admin role;
    // PostsService.remove checks that role, and the real id keeps the audit
    // trail honest instead of attributing the delete to the literal string
    // 'admin'.
    await this.postsService.remove(id, { userId: actingAdminId, role: 'admin' });
  }

  async dismissReport(id: string) {
    return this.reportsService.remove(id);
  }
}