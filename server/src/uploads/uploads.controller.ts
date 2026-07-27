import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const ALLOWED_TYPES = /^(image|video|audio|application\/pdf|text\/plain)\//;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function multerConfig(subdir?: string) {
  return {
    storage: diskStorage({
      destination: `./uploads${subdir ? `/${subdir}` : ''}`,
      filename: (_req: any, file: any, cb: any) => {
        const name = randomBytes(16).toString('hex');
        cb(null, `${name}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req: any, file: any, cb: any) => {
      if (ALLOWED_TYPES.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`File type "${file.mimetype}" is not allowed`), false);
      }
    },
  };
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig()))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/${file.filename}` };
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file', multerConfig('profiles')))
  uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/profiles/${file.filename}` };
  }
}