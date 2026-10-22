import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { MediaService } from '../media/media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStoryDto } from './dto/create-story.dto';

@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly mediaService: MediaService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (/^(image|video)\//.test(file.mimetype || '')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Story media must be an image or video'), false);
        }
      },
    })
  )
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req,
    @Body() createStoryDto: CreateStoryDto
  ) {
    if (file) {
      const uploaded = await this.mediaService.uploadFile(file, {
        userId: req.user.userId,
        subdir: 'stories',
      });
      createStoryDto.mediaUrl = uploaded.url;
    }

    if (typeof createStoryDto.elements === 'string') {
      createStoryDto.elements = this.parseElements(createStoryDto.elements);
    }

    if (typeof createStoryDto.backgroundOptions === 'string') {
      createStoryDto.backgroundOptions = JSON.parse(createStoryDto.backgroundOptions);
    }

    return this.storiesService.create(createStoryDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.storiesService.findActiveStoriesForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/view')
  trackView(@Param('id') id: string, @Request() req, @Body() body: { isAnonymous?: boolean }) {
    return this.storiesService.trackView(id, req.user.userId, body.isAnonymous || false);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/views')
  getViews(@Param('id') id: string, @Request() req) {
    return this.storiesService.getViews(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.storiesService.delete(id, req.user.userId);
  }

  private parseElements(elements: string) {
    try {
      return JSON.parse(elements);
    } catch {
      throw new BadRequestException('Invalid story elements payload');
    }
  }
}
