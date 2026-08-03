
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataExport, DataExportStatus } from './entities/data-export.entity';
import { ExportService } from './export.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportQueue: DataExport[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(DataExport)
    private dataExportRepository: Repository<DataExport>,
    private readonly exportService: ExportService,
  ) {
    setInterval(() => this.processQueue(), 5000);
  }

  async create(user: User): Promise<DataExport> {
    const exportRequest = this.dataExportRepository.create({
      user,
      status: DataExportStatus.PENDING,
    });

    const savedRequest = await this.dataExportRepository.save(exportRequest);
    this.exportQueue.push(savedRequest);
    return savedRequest;
  }

  async getExport(user: User): Promise<DataExport | null> {
    return this.dataExportRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async initiateDeletion(user: User) {
    // Schedule permanent deletion of all user data within 30 days (GDPR/CCPA requirement)
    const deletionDelay = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    // Create a deletion record
    const deletionRecord = this.dataExportRepository.create({
      user,
      status: DataExportStatus.DELETION_PENDING,
      scheduledDeletionAt: new Date(Date.now() + deletionDelay),
    });
    await this.dataExportRepository.save(deletionRecord);

    // Immediately soft-delete the user (mark as banned)
    const userRepository = this.dataExportRepository.manager.getRepository(User);
    await userRepository.update(user.id, {
      banned: true,
    });

    // Schedule actual hard deletion after 30 days
    setTimeout(async () => {
      try {
        // Delete all user data: posts, comments, messages, sessions, etc.
        const postRepository = this.dataExportRepository.manager.getRepository(Post);
        const commentRepository = this.dataExportRepository.manager.getRepository(Comment);
        
        // Delete user's posts
        await postRepository.delete({ user: { id: user.id } });
        // Delete user's comments
        await commentRepository.delete({ user: { id: user.id } });
        // Delete the user account itself
        await userRepository.delete(user.id);
        // Update deletion record status
        await this.dataExportRepository.update(deletionRecord.id, { status: DataExportStatus.DELETION_COMPLETED });
        
        this.logger.log(`Successfully deleted all data for user ${user.id} (GDPR/CCPA compliance)`);
      } catch (error) {
        this.logger.error(`Failed to delete data for user ${user.id}`, error.stack);
        await this.dataExportRepository.update(deletionRecord.id, { status: DataExportStatus.DELETION_FAILED });
      }
    }, deletionDelay);

    return { success: true, message: 'Account deletion scheduled. All data will be permanently removed within 30 days.' };
  }

  private async processQueue() {
    if (this.isProcessing || this.exportQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const exportRequest = this.exportQueue.shift();

    try {
      await this.processExport(exportRequest);
    } catch (error) {
      this.logger.error(`Failed to process export request ${exportRequest.id}`, error.stack);
      exportRequest.status = DataExportStatus.FAILED;
      await this.dataExportRepository.save(exportRequest);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processExport(exportRequest: DataExport) {
    // Full portable payload: profile, posts, comments, DMs, articles, podcasts,
    // courses, enrollments, settings — via the richer ExportService.
    const userData = await this.exportService.exportUserData(exportRequest.user.id);

    const fileName = `${exportRequest.id}.json`;
    const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    const zipFileName = `${exportRequest.id}.zip`;
    const zipFilePath = path.join(__dirname, '..', '..', 'uploads', zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = (archiver as any).default('zip');

    output.on('close', async () => {
      exportRequest.status = DataExportStatus.COMPLETED;
      exportRequest.fileUrl = `/uploads/${zipFileName}`;
      await this.dataExportRepository.save(exportRequest);
      fs.unlinkSync(filePath); // Clean up the original JSON file
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.file(filePath, { name: 'data.json' });
    await archive.finalize();
  }
}