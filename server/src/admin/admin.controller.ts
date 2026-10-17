import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ChangelogService } from './changelog.service';
import { CreateChangelogEntryDto } from './dto/create-changelog-entry.dto';
import { CreateSandboxEnvironmentDto } from './dto/create-sandbox-environment.dto';
import { UpdateSandboxEnvironmentDto } from './dto/update-sandbox-environment.dto';
import { SandboxEnvironmentsService } from './sandbox-environments.service';

const MAX_REPORT_PAGE_SIZE = 100;

@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly changelogService: ChangelogService,
    private readonly sandboxEnvironmentsService: SandboxEnvironmentsService,
  ) {}

  @Get('reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listReports(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.adminService.getReports(this.parsePageSize(take), this.parsePageSize(skip));
  }

  @Get('reports/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getReport(@Param('id') id: string) {
    return this.adminService.getReport(id);
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AdminGuard)
  dismissReport(@Param('id') id: string) {
    return this.adminService.dismissReport(id);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AdminGuard)
  deletePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deletePost(id, user.userId);
  }

  private parsePageSize(value?: string): number {
    const parsed = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return Math.min(parsed, MAX_REPORT_PAGE_SIZE);
  }

  @Post('users/:id/ban')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async banUser(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.ban(user);
  }

  @Post('changelog')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async publishChangelog(@Body() input: CreateChangelogEntryDto) {
    return this.changelogService.publish(input);
  }

  @Post('sandbox-environments')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createSandboxEnvironment(@Body() input: CreateSandboxEnvironmentDto) {
    return this.sandboxEnvironmentsService.create(input);
  }

  @Get('sandbox-environments')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listSandboxEnvironments() {
    return this.sandboxEnvironmentsService.list();
  }

  @Get('sandbox-environments/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSandboxEnvironment(@Param('id') id: string) {
    return this.sandboxEnvironmentsService.get(id);
  }

  @Patch('sandbox-environments/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSandboxEnvironment(@Param('id') id: string, @Body() input: UpdateSandboxEnvironmentDto) {
    return this.sandboxEnvironmentsService.update(id, input);
  }

  @Post('sandbox-environments/:id/archive')
  @UseGuards(JwtAuthGuard, AdminGuard)
  archiveSandboxEnvironment(@Param('id') id: string) {
    return this.sandboxEnvironmentsService.archive(id);
  }
}