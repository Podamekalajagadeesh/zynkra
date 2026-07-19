import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  async uploadFile(file: Express.Multer.File) {
    // Files are stored on local disk and served from /uploads (see main.ts
    // static assets). Swap for S3/CDN when a real media pipeline lands.
    return { url: `/uploads/${file.filename}` };
  }
}
