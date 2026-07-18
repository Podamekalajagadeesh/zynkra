import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Balance } from './entities/balance.entity';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Balance, User, Post]),
    UsersModule,
  ],
  providers: [TokenService],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {}