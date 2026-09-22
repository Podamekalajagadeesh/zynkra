import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';

export interface MediaUploadResult {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

@Injectable()
export class MediaService {
  private readonly uploadDir: string;
  private readonly maxImageSize = 10 * 1024 * 1024; // 10MB
  private readonly maxVideoSize = 100 * 1024 * 1024; // 100MB
  private readonly maxAudioSize = 20 * 1024 * 1024; // 20MB

  private sharpInstance: any = null;
  private sharpAttempted = false;

  private loadSharp(): any {
    if (!this.sharpAttempted) {
      this.sharpAttempted = true;
      try {
        this.sharpInstance = require('sharp');
      } catch (error) {
        this.sharpInstance = null;
        console.warn('sharp unavailable:', error);
      }
    }
    return this.sharpInstance;
  }

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    const dirs = ['images', 'videos', 'audio', 'thumbnails'];
    for (const dir of dirs) {
      const dirPath = join(this.uploadDir, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  private getMediaType(mimetype: string): 'image' | 'video' | 'audio' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    throw new BadRequestException(`Unsupported media type: ${mimetype}`);
  }

  private validateFileSize(file: Express.Multer.File, type: 'image' | 'video' | 'audio'): void {
    const limits = {
      image: this.maxImageSize,
      video: this.maxVideoSize,
      audio: this.maxAudioSize,
    };

    if (file.size > limits[type]) {
      throw new BadRequestException(
        `File too large. Maximum size for ${type}: ${limits[type] / 1024 / 1024}MB`,
      );
    }
  }

  private generateFilename(originalname: string): string {
    const name = randomBytes(16).toString('hex');
    const ext = extname(originalname).toLowerCase();
    return `${name}${ext}`;
  }

  private getSubdir(type: 'image' | 'video' | 'audio'): string {
    return type === 'image' ? 'images' : type === 'video' ? 'videos' : 'audio';
  }

  async uploadFile(file: Express.Multer.File): Promise<MediaUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const type = this.getMediaType(file.mimetype);
    this.validateFileSize(file, type);

    const filename = this.generateFilename(file.originalname);
    const subdir = this.getSubdir(type);
    const filePath = join(this.uploadDir, subdir, filename);

    // Save file to disk
    writeFileSync(filePath, file.buffer);

    // Process image if applicable
    let width: number | undefined;
    let height: number | undefined;
    let processedBuffer = file.buffer;

    if (type === 'image') {
      const sharp = this.loadSharp();
      if (sharp) {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Generate thumbnail
        await this.generateThumbnail(file.buffer, filename);
      } else {
        console.warn('sharp unavailable — skipping image metadata and thumbnail');
      }
    }

    // Create media record
    const media = this.mediaRepository.create({
      url: `/uploads/${subdir}/${filename}`,
      type,
      altText: file.originalname,
    });

    const savedMedia = await this.mediaRepository.save(media);

    return {
      id: savedMedia.id,
      url: savedMedia.url,
      type,
      width,
      height,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    options: ImageProcessingOptions = {},
  ): Promise<MediaUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 85,
      format = 'webp',
    } = options;

    // Process image
    const sharp = this.loadSharp();
    if (!sharp) {
      throw new BadRequestException('Image processing unavailable (sharp not installed)');
    }

    let processor = sharp(file.buffer);

    // Resize if needed
    processor = processor.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Convert to target format
    processor = processor[format]({ quality });

    const processedBuffer = await processor.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    // Generate filename
    const filename = this.generateFilename(file.originalname).replace(/\.[^.]+$/, `.${format}`);
    const filePath = join(this.uploadDir, 'images', filename);

    // Save processed image
    writeFileSync(filePath, processedBuffer);

    // Generate thumbnail
    await this.generateThumbnail(processedBuffer, filename);

    // Create media record
    const media = this.mediaRepository.create({
      url: `/uploads/images/${filename}`,
      type: 'image',
      altText: file.originalname,
    });

    const savedMedia = await this.mediaRepository.save(media);

    return {
      id: savedMedia.id,
      url: savedMedia.url,
      type: 'image',
      width: metadata.width,
      height: metadata.height,
      size: processedBuffer.length,
      mimeType: `image/${format}`,
    };
  }

  private async generateThumbnail(buffer: Buffer, filename: string): Promise<void> {
    try {
      const sharp = this.loadSharp();
      if (!sharp) {
        console.warn('sharp unavailable — skipping thumbnail generation');
        return;
      }
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailPath = join(this.uploadDir, 'thumbnails', `thumb_${filename.replace(/\.[^.]+$/, '.jpg')}`);
      writeFileSync(thumbnailPath, thumbnailBuffer);
    } catch (error) {
      // Thumbnail generation is non-critical
      console.warn('Failed to generate thumbnail:', error);
    }
  }

  async getMedia(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new BadRequestException('Media not found');
    }
    return media;
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await this.getMedia(id);
    
    // Delete file from disk
    const filePath = join(process.cwd(), media.url);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // Delete thumbnail if exists
    if (media.type === 'image') {
      const thumbPath = join(
        process.cwd(),
        'uploads',
        'thumbnails',
        `thumb_${media.url.split('/').pop()?.replace(/\.[^.]+$/, '.jpg')}`,
      );
      if (existsSync(thumbPath)) {
        unlinkSync(thumbPath);
      }
    }

    await this.mediaRepository.remove(media);
  }
}
