import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IpfsService } from './ipfs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ipfs')
@UseGuards(JwtAuthGuard)
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB max
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif|mp4|webm|pdf|doc|docx)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<{ cid: string; url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const cid = await this.ipfsService.upload(file.buffer);
    return {
      cid,
      url: `ipfs://${cid}`,
    };
  }

  @Get('pinned')
  async getPinnedFiles(@CurrentUser() user: User): Promise<string[]> {
    return this.ipfsService.getPinnedFiles();
  }

  @Get(':cid')
  async getFile(@Param('cid') cid: string, @CurrentUser() user: User) {
    const buffer = await this.ipfsService.getFile(cid);
    return buffer;
  }

  @Post(':cid/pin')
  async pinFile(@Param('cid') cid: string, @CurrentUser() user: User): Promise<{ success: boolean }> {
    await this.ipfsService.pinFile(cid);
    return { success: true };
  }

  @Delete(':cid')
  async unpinFile(@Param('cid') cid: string, @CurrentUser() user: User): Promise<{ success: boolean }> {
    await this.ipfsService.unpinFile(cid);
    return { success: true };
  }
}