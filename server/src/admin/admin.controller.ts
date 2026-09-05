import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangelogService } from './changelog.service';
import { CreateChangelogEntryDto } from './dto/create-changelog-entry.dto';
import { CreateSandboxEnvironmentDto } from './dto/create-sandbox-environment.dto';
import { UpdateSandboxEnvironmentDto } from './dto/update-sandbox-environment.dto';
import { SandboxEnvironmentsService } from './sandbox-environments.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly changelogService: ChangelogService,
    private readonly sandboxEnvironmentsService: SandboxEnvironmentsService,
  ) {}

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