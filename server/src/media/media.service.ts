import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  async uploadFile(file: Express.Multer.File) {
    // In a real app, you'd upload to S3 or other storage and return the URL
    return { url: `https://example.com/media/${file.originalname}` };
  }
}