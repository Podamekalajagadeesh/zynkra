import { Controller, Post, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.ban(user);
  }
}