import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { randomBytes } from 'crypto';
import { extname, join, resolve, sep } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';

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

export interface MediaUploadContext {
  /** Authenticated uploader. Optional only for legacy/system paths. */
  userId?: string;
  /** Subdirectory under the upload root (e.g. "profiles"). Default per media type. */
  subdir?: string;
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
    this.uploadDir = resolve(this.configService.get('UPLOAD_DIR', './uploads'));
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    const dirs = ['images', 'videos', 'audio', 'thumbnails', 'profiles', 'avatars', 'stories'];
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

  /**
   * Map a stored public URL (/uploads/… or CDN_BASE_URL/uploads/…) to a
   * filesystem path that is guaranteed to stay inside the upload root.
   */
  private pathFromUrl(url: string): string {
    let pathPart = url;
    if (/^https?:\/\//i.test(url)) {
      try {
        pathPart = new URL(url).pathname;
      } catch {
        throw new BadRequestException('Not a local media URL');
      }
    }
    const match = /^\/uploads\/(.+)$/.exec(pathPart);
    if (!match) {
      throw new BadRequestException('Not a local media URL');
    }
    const resolved = resolve(this.uploadDir, match[1]);
    const root = resolve(this.uploadDir);
    if (resolved !== root && !resolved.startsWith(root + sep)) {
      throw new BadRequestException('Invalid media path');
    }
    return resolved;
  }

  /** Public URL for a path relative to the upload root. */
  private publicUrl(relativePath: string): string {
    const cdnBase = (this.configService.get('CDN_BASE_URL') || '').replace(/\/+$/, '');
    const normalized = relativePath.replace(/^\/+/, '');
    if (cdnBase) {
      return `${cdnBase}/uploads/${normalized}`;
    }
    return `/uploads/${normalized}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    context: MediaUploadContext = {},
  ): Promise<MediaUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const type = this.getMediaType(file.mimetype);
    this.validateFileSize(file, type);

    const filename = this.generateFilename(file.originalname);
    const subdir = context.subdir || this.getSubdir(type);
    const dirPath = join(this.uploadDir, subdir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    const filePath = join(dirPath, filename);

    writeFileSync(filePath, file.buffer);

    let width: number | undefined;
    let height: number | undefined;

    if (type === 'image') {
      const sharp = this.loadSharp();
      if (sharp) {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width;
        height = metadata.height;
        await this.generateThumbnail(file.buffer, filename);
      } else {
        console.warn('sharp unavailable — skipping image metadata and thumbnail');
      }
    }

    const media = this.mediaRepository.create({
      url: this.publicUrl(`${subdir}/${filename}`),
      type,
      altText: file.originalname,
      userId: context.userId,
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
    context: MediaUploadContext = {},
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

    const sharp = this.loadSharp();
    if (!sharp) {
      throw new BadRequestException('Image processing unavailable (sharp not installed)');
    }

    let processor = sharp(file.buffer);

    processor = processor.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    processor = processor[format]({ quality });

    const processedBuffer = await processor.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    const subdir = context.subdir || 'images';
    const filename = this.generateFilename(file.originalname).replace(/\.[^.]+$/, `.${format}`);
    const dirPath = join(this.uploadDir, subdir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    writeFileSync(join(dirPath, filename), processedBuffer);

    await this.generateThumbnail(processedBuffer, filename);

    const media = this.mediaRepository.create({
      url: this.publicUrl(`${subdir}/${filename}`),
      type: 'image',
      altText: file.originalname,
      userId: context.userId,
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

      const thumbDir = join(this.uploadDir, 'thumbnails');
      if (!existsSync(thumbDir)) {
        mkdirSync(thumbDir, { recursive: true });
      }
      writeFileSync(
        join(thumbDir, `thumb_${filename.replace(/\.[^.]+$/, '.jpg')}`),
        thumbnailBuffer,
      );
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }
  }

  async getMedia(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  /**
   * Delete a media record and its files. The caller must pass the
   * authenticated user; ownership is enforced here (legacy rows with no
   * owner are deletable by any authenticated user).
   */
  async deleteMedia(id: string, userId?: string): Promise<void> {
    const media = await this.getMedia(id);

    if (media.userId && userId && media.userId !== userId) {
      throw new ForbiddenException('You do not own this media');
    }
    if (media.userId && !userId) {
      throw new ForbiddenException('You do not own this media');
    }

    // Resolve first so path traversal fails the delete instead of being
    // swallowed as a "CDN URL" (only /uploads/… URLs are stored locally).
    const filePath = this.pathFromUrl(media.url);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    if (media.type === 'image') {
      try {
        const basename = filePath.split(/[\\/]/).pop();
        if (basename) {
          const thumbPath = join(
            this.uploadDir,
            'thumbnails',
            `thumb_${basename.replace(/\.[^.]+$/, '.jpg')}`,
          );
          const root = resolve(this.uploadDir);
          if (
            (thumbPath === root || thumbPath.startsWith(root + sep)) &&
            existsSync(thumbPath)
          ) {
            unlinkSync(thumbPath);
          }
        }
      } catch {
        // Thumbnail cleanup is best-effort.
      }
    }

    await this.mediaRepository.remove(media);
  }

  /**
   * Resolve an uploaded media URL to an owned Media row for attaching to a
   * post. Returns null when no matching row exists (caller may create one).
   */
  async findOwnedByUrl(url: string, userId: string): Promise<Media | null> {
    return this.mediaRepository.findOne({ where: { url, userId } });
  }

  async findById(id: string): Promise<Media | null> {
    return this.mediaRepository.findOne({ where: { id } });
  }
}
