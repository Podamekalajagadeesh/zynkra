import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete, Patch, Query, Put } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { SetCollaboratorsDto } from './dto/set-collaborators.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    // The user ID is available on the request thanks to the JwtAuthGuard
    return this.postsService.create(
      req.user,
      createPostDto,
      createPostDto.reelEffectId,
      createPostDto.groupId,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Request() req,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const userId = req.user ? req.user.userId : undefined;
    return this.postsService.findAll(userId, take ? +take : 10, skip ? +skip : 0);
  }

  @UseGuards(JwtAuthGuard)
  @Post('drafts')
  createDraft(@Request() req, @Body() dto: CreateDraftDto) {
    return this.postsService.createDraft(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('drafts')
  getDrafts(@Request() req) {
    return this.postsService.findDrafts(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('drafts/:id')
  getDraft(@Param('id') id: string, @Request() req) {
    return this.postsService.findDraft(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('drafts/:id')
  updateDraft(@Param('id') id: string, @Request() req, @Body() dto: UpdateDraftDto) {
    return this.postsService.updateDraft(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('drafts/:id/publish')
  publishDraft(@Param('id') id: string, @Request() req) {
    return this.postsService.publishDraft(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('drafts/:id')
  deleteDraft(@Param('id') id: string, @Request() req) {
    return this.postsService.deleteDraft(req.user.userId, id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user ? req.user.userId : undefined;
    return this.postsService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  like(@Param('id') id: string, @Request() req) {
    return this.postsService.like(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  unlike(@Param('id') id: string, @Request() req) {
    return this.postsService.unlike(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() createPostDto: CreatePostDto,
    @Request() req,
  ) {
    return this.postsService.update(id, createPostDto.content, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/collaborators')
  setCollaborators(@Param('id') id: string, @Request() req, @Body() dto: SetCollaboratorsDto) {
    return this.postsService.setCollaborators(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/analytics')
  analytics(@Param('id') id: string, @Request() req) {
    return this.postsService.getPostAnalytics(req.user.userId, id);
  }

  @Get(':id/similar')
  @UseGuards(OptionalJwtAuthGuard)
  similar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.postsService.findSimilarPosts(id, limit ? Math.min(+limit, 20) : 10);
  }

  @Get(':id/oembed')
  @UseGuards(OptionalJwtAuthGuard)
  oembed(@Param('id') id: string) {
    return this.postsService.getOEmbed(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/archive')
  archive(@Param('id') id: string, @Request() req) {
    return this.postsService.archive(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('repost/:id')
  repost(@Param('id') id: string, @Request() req) {
    return this.postsService.repost(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/pin')
  togglePin(@Param('id') id: string, @Request() req) {
    return this.postsService.togglePin(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/show-likes')
  updateShowLikes(
    @Param('id') id: string,
    @Body('showLikes') showLikes: boolean,
    @Request() req,
  ) {
    return this.postsService.updateShowLikes(id, showLikes, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/feature')
  feature(@Param('id') id: string, @Request() req) {
    return this.postsService.feature(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/feature')
  unfeature(@Param('id') id: string, @Request() req) {
    return this.postsService.unfeature(id, req.user);
  }

  @Get('/users/:userId/posts')
  findPostsByUserId(@Param('userId') userId: string) {
    return this.postsService.findPostsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/repost')
  undoRepost(@Param('id') id: string, @Request() req) {
    return this.postsService.undoRepost(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  share(@Param('id') id: string, @Request() req) {
    return this.postsService.share(id, req.user);
  }
}