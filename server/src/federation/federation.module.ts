import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FederationController } from './federation.controller';
import { FederationWellKnownController } from './federation.wellknown.controller';
import { FederationService } from './federation.service';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost } from './entities/remote-post.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RemoteInstance, RemoteUser, RemotePost]),
    UsersModule,
    PostsModule,
    AuthModule,
  ],
  controllers: [FederationController, FederationWellKnownController],
  providers: [FederationService],
  exports: [FederationService],
})
export class FederationModule {}