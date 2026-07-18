import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DigitalAssetsService } from './digital-assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { TransferAssetDto } from './dto/transfer-asset.dto';

@Controller('digital-assets')
export class DigitalAssetsController {
  constructor(private readonly digitalAssetsService: DigitalAssetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createAsset(
    @CurrentUser() user: any,
    @Body() createAssetDto: CreateAssetDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })], // 100MB max
      }),
    ) file: Express.Multer.File,
  ) {
    return this.digitalAssetsService.createAsset(user.id, createAssetDto, file.buffer);
  }

  @Get('my-assets')
  @UseGuards(JwtAuthGuard)
  async getMyAssets(@CurrentUser() user: any) {
    return this.digitalAssetsService.getUserAssets(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAssetById(@Param('id') id: string) {
    return this.digitalAssetsService.getAssetById(id);
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  async transferAsset(
    @CurrentUser() user: any,
    @Body() transferAssetDto: TransferAssetDto,
  ) {
    return this.digitalAssetsService.transferAsset(user.id, transferAssetDto);
  }

  @Post(':id/sync-to-instance/:domain')
  @UseGuards(JwtAuthGuard)
  async syncAssetToRemoteInstance(
    @Param('id') id: string,
    @Param('domain') domain: string,
  ) {
    return this.digitalAssetsService.syncAssetToRemoteInstance(id, domain);
  }

  @Get(':id/verify-interoperability/:platform')
  @UseGuards(JwtAuthGuard)
  async verifyAssetInteroperability(
    @Param('id') id: string,
    @Param('platform') platform: string,
  ) {
    return this.digitalAssetsService.verifyAssetInteroperability(id, platform);
  }
}