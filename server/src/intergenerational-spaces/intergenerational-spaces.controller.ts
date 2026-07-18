import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { IntergenerationalSpacesService } from './intergenerational-spaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('intergenerational-spaces')
export class IntergenerationalSpacesController {
  constructor(private readonly intergenerationalSpacesService: IntergenerationalSpacesService) {}

  @Get()
  async getAllSpaces() {
    return this.intergenerationalSpacesService.getAllSpaces();
  }

  @Get(':id')
  async getSpace(@Param('id') id: string) {
    return this.intergenerationalSpacesService.getSpaceById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSpace(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.intergenerationalSpacesService.createSpace(body, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinSpace(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.intergenerationalSpacesService.joinSpace(id, userId, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveSpace(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.intergenerationalSpacesService.leaveSpace(id, userId);
  }

  @Get('user/my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.intergenerationalSpacesService.getUserMemberships(userId);
  }

  @Get(':id/members')
  async getSpaceMembers(@Param('id') id: string) {
    return this.intergenerationalSpacesService.getSpaceMembers(id);
  }
}
