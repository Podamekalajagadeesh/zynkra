import {
  Controller,
  UseGuards,
  Post,
  Body,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { SetNftPfpDto } from './dto/set-nft-pfp.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('connect')
  connectWallet(@Req() req, @Body() connectWalletDto: ConnectWalletDto) {
    return this.walletService.connectWallet(req.user, connectWalletDto.walletAddress);
  }

  @Get('balance')
  getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('nfts/:walletAddress')
  getNfts(@Param('walletAddress') walletAddress: string) {
    return this.walletService.getNfts(walletAddress);
  }

  @Post('set-nft-pfp')
  setNftPfp(@Req() req, @Body() setNftPfpDto: SetNftPfpDto) {
    return this.walletService.setNftPfp(req.user, setNftPfpDto);
  }
}