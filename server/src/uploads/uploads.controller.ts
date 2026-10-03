import {
  BadRequestException,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join, resolve, sep } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from '../media/media.service';

const ALLOWED_TYPES = /^(image\/|video\/|audio\/)|^application\/pdf$|^text\/plain$/;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const UPLOAD_ROOT = resolve(process.env.UPLOAD_DIR || './uploads');

const filterOptions = {
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (ALLOWED_TYPES.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`File type "${file.mimetype}" is not allowed`), false);
    }
  },
};

/**
 * Shared upload surface. Image/video/audio go through MediaService (memory
 * buffer) so every file gets ownership, size checks, and a media row. PDF/text
 * keep a simple disk path under the upload root.
 */
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', filterOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (/^(image|video|audio)\//.test(file.mimetype)) {
      return this.mediaService.uploadFile(file, { userId: req.user?.userId });
    }

    // pdf / plain text — stored on disk only (legacy shape: { url })
    const name = `${randomBytes(16).toString('hex')}${extname(file.originalname).toLowerCase()}`;
    const dir = join(UPLOAD_ROOT, 'documents');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filePath = join(dir, name);
    const root = UPLOAD_ROOT;
    if (resolve(filePath) !== root && !resolve(filePath).startsWith(root + sep)) {
      throw new BadRequestException('Invalid upload path');
    }
    writeFileSync(filePath, file.buffer);
    return { url: `/uploads/documents/${name}` };
  }

  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.mediaService.uploadFile(file, {
      userId: req.user?.userId,
      subdir: 'profiles',
    });
  }
}
