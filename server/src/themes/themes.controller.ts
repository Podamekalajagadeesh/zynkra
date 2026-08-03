import { Body, BadRequestException, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThemesService } from './themes.service';
import { UsersService } from '../users/users.service';

class SetThemeDto {
  @IsString()
  theme: string;

  @IsOptional()
  @Matches(/^#([0-9a-f]{3}){1,2}$/i, {
    message: 'themeColor must be a valid hex color code',
  })
  themeColor?: string;
}

@Controller()
export class ThemesController {
  constructor(
    private readonly themesService: ThemesService,
    private readonly usersService: UsersService,
  ) {}

  // Public catalog of available creator/profile themes.
  @Get('themes')
  list() {
    return this.themesService.list();
  }

  // Set the authenticated user's profile theme + optional custom accent.
  @UseGuards(JwtAuthGuard)
  @Put('users/me/theme')
  async setTheme(@Req() req, @Body() dto: SetThemeDto) {
    if (!this.themesService.validate(dto.theme)) {
      throw new BadRequestException(`Unknown theme "${dto.theme}"`);
    }
    return this.usersService.update(req.user.userId, {
      profileTheme: dto.theme,
      profileThemeColor: dto.themeColor,
    });
  }
}
