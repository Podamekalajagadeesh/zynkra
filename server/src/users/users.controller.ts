import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
  Post,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { PagesService } from '../pages/pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from './entities/user.entity';
import { Page } from '../pages/entities/page.entity';
import { Poke } from './entities/poke.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { FileUploadDto } from './dto/file-upload.dto';
import { UpdateFaceRecognitionDto } from './dto/update-face-recognition.dto';
import { CreateLifeEventDto } from './dto/create-life-event.dto';
import { UpdateLifeEventDto } from './dto/update-life-event.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly pagesService: PagesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me/face-recognition')
  async updateFaceRecognition(
    @Request() req,
    @Body() updateFaceRecognitionDto: UpdateFaceRecognitionDto,
  ): Promise<User> {
    return this.usersService.updateFaceRecognition(
      req.user.userId,
      updateFaceRecognitionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req, @UploadedFile() file: any): Promise<User> {
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateUserDto, avatar);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req): Promise<Omit<User, 'password_hash'>> {
    const user = await this.usersService.findOneById(req.user.userId, [
      'following',
      'followers',
    ]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<Omit<User, 'password_hash'>> {
    const user = await this.usersService.findOneById(req.user.userId, [
      'following',
      'followers',
    ]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async update(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req): Promise<void> {
    return this.usersService.delete(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Request() req): Promise<void> {
    await this.usersService.deactivate(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/restrict')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restrict(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.restrict(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/restrict')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unrestrict(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.unrestrict(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('restricted')
  async getRestrictedUsers(@Request() req): Promise<User[]> {
    return this.usersService.getRestrictedUsers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async block(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.block(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.unblock(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  async getBlockedUsers(@Request() req): Promise<User[]> {
    return this.usersService.getBlockedUsers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked/keywords')
  async getBlockedKeywords(@Request() req): Promise<string[]> {
    return this.usersService.getBlockedKeywords(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked/hashtags')
  async getBlockedHashtags(@Request() req): Promise<string[]> {
    return this.usersService.getBlockedHashtags(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block/content-types/:contentType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockContentType(@Request() req, @Param('contentType') contentType: string): Promise<void> {
    return this.usersService.blockContentType(req.user.userId, contentType);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('block/content-types/:contentType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockContentType(@Request() req, @Param('contentType') contentType: string): Promise<void> {
    return this.usersService.unblockContentType(req.user.userId, contentType);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked/content-types')
  async getBlockedContentTypes(@Request() req): Promise<string[]> {
    return this.usersService.getBlockedContentTypes(req.user.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username')
  async findByUsername(
    @Request() req,
    @Param('username') username: string,
  ): Promise<User | null> {
    const requestingUserId = req.user ? req.user.userId : undefined;
    return this.usersService.findByUsername(username, requestingUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async follow(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.follow(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.unfollow(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('followers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFollower(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.unfollow(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async favorite(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.addFavorite(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfavorite(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.removeFavorite(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/hashtags/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followHashtag(@Request() req, @Body() body: { name: string }): Promise<void> {
    return this.usersService.followHashtag(req.user.userId, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/hashtags/follow/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowHashtag(@Request() req, @Param('name') name: string): Promise<void> {
    return this.usersService.unfollowHashtag(req.user.userId, decodeURIComponent(name));
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/keywords/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockKeyword(@Request() req, @Body() body: { keyword: string }): Promise<void> {
    return this.usersService.blockKeyword(req.user.userId, body.keyword);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/keywords/block/:keyword')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockKeyword(@Request() req, @Param('keyword') keyword: string): Promise<void> {
    return this.usersService.unblockKeyword(req.user.userId, decodeURIComponent(keyword));
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/hashtags/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockHashtag(@Request() req, @Body() body: { name: string }): Promise<void> {
    return this.usersService.blockHashtag(req.user.userId, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/hashtags/block/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockHashtag(@Request() req, @Param('name') name: string): Promise<void> {
    return this.usersService.unblockHashtag(req.user.userId, decodeURIComponent(name));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followRequest(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.createFollowRequest(req.user.userId, id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getPublicProfile(
    @Request() req,
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ): Promise<Omit<User, 'password_hash'>> {
    const currentUserId = req.user?.userId;
    const user = await this.usersService.findOneWithPosts(
      id,
      currentUserId,
      take ? +take : 10,
      skip ? +skip : 0,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { ...result } = user;
    return result;
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  async searchUsers(@Request() req, @Query('q') query: string): Promise<User[]> {
    const searchingUserId = req.user ? req.user.userId : undefined;
    return this.usersService.search(query, searchingUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/mutual')
  async getMutualFollows(
    @Request() req,
    @Param('id') id: string,
  ): Promise<User[]> {
    return this.usersService.findMutualFollows(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow-requests/:id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptFollowRequest(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.acceptFollowRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow-requests/:id/deny')
  @HttpCode(HttpStatus.NO_CONTENT)
  async denyFollowRequest(@Request() req, @Param('id') id: string): Promise<void> {
    return this.usersService.denyFollowRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('suggestions')
  async getFollowSuggestions(@Request() req): Promise<{ users: User[], pages: Page[] }> {
    const users = await this.usersService.findFollowSuggestions(req.user.userId);
    const pages = await this.pagesService.findPageSuggestions(req.user.userId);
    return { users, pages };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/close-friends')
  async getCloseFriends(@Request() req): Promise<User[]> {
    return this.usersService.getCloseFriends(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/close-friends')
  async updateCloseFriends(
    @Request() req,
    @Body() { closeFriendIds }: { closeFriendIds: string[] },
  ): Promise<User> {
    return this.usersService.updateCloseFriends(req.user.userId, closeFriendIds);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/followers')
  async getMyFollowers(@Request() req): Promise<User[]> {
    return this.usersService.getFollowers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/notification-settings')
  async updateNotificationSettings(
    @Request() req,
    @Body() settings: NotificationSettingsDto,
  ): Promise<User> {
    return this.usersService.updateNotificationSettings(req.user.userId, settings);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/life-events')
  async addLifeEvent(
    @Request() req,
    @Body() createLifeEventDto: CreateLifeEventDto,
  ) {
    return this.usersService.addLifeEvent(req.user.userId, createLifeEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/life-events/:id')
  async updateLifeEvent(
    @Param('id') id: string,
    @Body() updateLifeEventDto: UpdateLifeEventDto,
  ) {
    return this.usersService.updateLifeEvent(id, updateLifeEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/life-events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLifeEvent(@Param('id') id: string): Promise<void> {
    return this.usersService.removeLifeEvent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/privacy')
  async updatePrivacy(
    @Request() req,
    @Body() updatePrivacyDto: UpdatePrivacyDto,
  ): Promise<User> {
    return this.usersService.updatePrivacy(req.user.userId, updatePrivacyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/poke')
  async pokeUser(@Request() req, @Param('id') receiverId: string): Promise<Poke> {
    return this.usersService.pokeUser(req.user.userId, receiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/pokes')
  async getPokes(@Request() req): Promise<Poke[]> {
    return this.usersService.getPokes(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/pokes/:id/return')
  async returnPoke(@Request() req, @Param('id') pokeId: string): Promise<Poke> {
    return this.usersService.returnPoke(pokeId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/pokes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissPoke(@Request() req, @Param('id') pokeId: string): Promise<void> {
    return this.usersService.dismissPoke(pokeId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/submit-verification')
  @UseInterceptors(FileInterceptor('idDocument'))
  async submitVerification(@Request() req, @UploadedFile() file: Express.Multer.File): Promise<User> {
    return this.usersService.submitVerification(req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verification-requests/pending')
  async getPendingVerifications(@Request() req): Promise<User[]> {
    return this.usersService.getPendingVerifications(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/verify')
  async verifyUser(@Request() req, @Param('id') id: string): Promise<User> {
    return this.usersService.verifyUser(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unverify')
  async unverifyUser(@Request() req, @Param('id') id: string): Promise<User> {
    return this.usersService.unverifyUser(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject-verification')
  async rejectVerification(@Request() req, @Param('id') id: string): Promise<User> {
    return this.usersService.rejectVerification(id, req.user.userId);
  }
}