import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';

const ALLOWED_MEDIA = /^(image|video|audio)\//;

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MEDIA.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image, video, and audio files are allowed'), false);
        }
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.mediaService.uploadFile(file, { userId: req.user?.userId });
  }

  /**
   * E2EE DM attachments (Phase 3): the client encrypts the bytes
   * (XChaCha20-Poly1305) before upload; the matching key travels only
   * inside the Signal-encrypted message envelope. The server stores the
   * ciphertext verbatim — no metadata, no thumbnails, no decryption key.
   * `type` labels the row for the client renderer; the mimetype stays
   * octet-stream because the bytes are opaque.
   */
  @Post('upload/e2ee')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/octet-stream') {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'E2EE attachments must be uploaded as application/octet-stream ciphertext'
            ),
            false
          );
        }
      },
    })
  )
  async uploadE2eeAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('type') type?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (type !== 'image' && type !== 'video' && type !== 'audio') {
      throw new BadRequestException('type must be one of: image, video, audio');
    }
    // Re-label the ciphertext blob as its plaintext type so the media row
    // routes to the right subdir and the client renders it correctly after
    // decryption. The stored bytes are never interpreted by the server.
    const relabeled: Express.Multer.File = {
      ...file,
      mimetype: `${type}/e2ee-ciphertext`,
      originalname: `${type}.enc`,
    };
    return this.mediaService.uploadFile(relabeled, {
      userId: req.user?.userId,
      encrypted: true,
    });
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    })
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('maxWidth') maxWidth?: string,
    @Query('maxHeight') maxHeight?: string,
    @Query('quality') quality?: string,
    @Query('format') format?: 'jpeg' | 'png' | 'webp' | 'avif'
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.mediaService.uploadImage(
      file,
      {
        maxWidth: maxWidth ? parseInt(maxWidth, 10) : undefined,
        maxHeight: maxHeight ? parseInt(maxHeight, 10) : undefined,
        quality: quality ? parseInt(quality, 10) : undefined,
        format,
      },
      { userId: req.user?.userId }
    );
  }

  @Get(':id')
  async getMedia(@Param('id') id: string) {
    return this.mediaService.getMedia(id);
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @Request() req) {
    await this.mediaService.deleteMedia(id, req.user?.userId);
    return { success: true };
  }
}
