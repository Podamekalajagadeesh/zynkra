import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto, req.user);
  }

  @Get('following')
  async getFollowingNotes(@Request() req) {
    const followingIds = await this.usersService.findFollowingIds(req.user.id);
    return this.notesService.findFollowingNotes(req.user.id, followingIds);
  }

  @Get('user/:userId')
  async getUserNote(@Param('userId') userId: string) {
    return this.notesService.findUserNote(userId);
  }

  @Get('post/:postId')
  async getNotesForPost(@Param('postId') postId: string) {
    return this.notesService.findByPost(postId);
  }

  @Post(':id/vote')
  async voteOnNote(@Param('id') id: string, @Body('isUpvote') isUpvote: boolean) {
    return this.notesService.voteHelpfulness(id, isUpvote);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.notesService.delete(id, req.user.id);
  }
}