import {
  Controller,
  UseGuards,
  Post,
  Body,
  Req,
  Get,
  Param,
  Query,
  Session,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { SetNftPfpDto } from './dto/set-nft-pfp.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /** Issue a one-time message the wallet must sign before it can be linked. */
  @Get('connect/challenge')
  getConnectChallenge(
    @Req() req,
    @Query('walletAddress') walletAddress: string,
    @Session() session: Record<string, any>,
  ) {
    const nonce = randomBytes(16).toString('hex');
    session.walletLinkNonce = nonce;
    return {
      message: this.walletService.buildLinkMessage(
        req.user.userId,
        walletAddress,
        nonce,
      ),
    };
  }

  @Post('connect')
  async connectWallet(
    @Req() req,
    @Body() connectWalletDto: ConnectWalletDto,
    @Session() session: Record<string, any>,
  ) {
    const nonce = session.walletLinkNonce;
    session.walletLinkNonce = null; // single use
    return this.walletService.connectWallet(
      req.user.userId,
      connectWalletDto.walletAddress,
      connectWalletDto.signature,
      nonce,
    );
  }

  @Post('disconnect')
  disconnectWallet(@Req() req) {
    return this.walletService.disconnectWallet(req.user.userId);
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
    return this.walletService.setNftPfp(req.user.userId, setNftPfpDto);
  }
}
