import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FederationController } from './federation.controller';
import { FederationService } from './federation.service';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost } from './entities/remote-post.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RemoteInstance, RemoteUser, RemotePost]),
    AuthModule,
  ],
  controllers: [FederationController],
  providers: [FederationService],
  exports: [FederationService],
})
export class FederationModule {}