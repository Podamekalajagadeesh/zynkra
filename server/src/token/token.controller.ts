import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { TransferDto } from './dto/transfer.dto';

@Controller('token')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('balance/:tokenSymbol')
  async getBalance(@Request() req, @Param('tokenSymbol') tokenSymbol: string) {
    const user = await this.usersService.findOneById(req.user.userId);
    return this.tokenService.getBalance(user, tokenSymbol);
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  async transfer(@Request() req, @Body() transferDto: TransferDto) {
    const fromUser = await this.usersService.findOneById(req.user.userId);
    const toUser = await this.usersService.findOneById(transferDto.toUserId);
    await this.tokenService.transfer(fromUser, toUser, transferDto.tokenSymbol, transferDto.amount);
    return { message: 'Transfer successful' };
  }
}