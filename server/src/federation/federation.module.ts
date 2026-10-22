import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FederationController } from './federation.controller';
import { FederationWellKnownController } from './federation.wellknown.controller';
import { FederationService } from './federation.service';
import { HttpSignaturesService } from './http-signatures.service';
import { RemoteInstance } from './entities/remote-instance.entity';
import { RemoteUser } from './entities/remote-user.entity';
import { RemotePost } from './entities/remote-post.entity';
import { InstanceKey } from './entities/instance-key.entity';
import { FederationModeration } from './entities/federation-moderation.entity';
import { FederationFollow } from './entities/federation-follow.entity';
import { FederationOutbox } from './entities/federation-outbox.entity';
import { FederationDeliveryAttempt } from './entities/federation-delivery-attempt.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { PostFederationService } from './post-federation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RemoteInstance,
      RemoteUser,
      RemotePost,
      InstanceKey,
      FederationModeration,
      FederationFollow,
      FederationOutbox,
      FederationDeliveryAttempt,
    ]),
    UsersModule,
    // forwardRef mirrors the PostsModule -> FederationModule edge. Federation
    // needs PostsService to render the local outbox; PostFederationService needs
    // FederationService to deliver. Both are real dependencies, so the cycle is
    // broken with forwardRef on both sides rather than avoided.
    forwardRef(() => PostsModule),
    AuthModule,
  ],
  controllers: [FederationController, FederationWellKnownController],
  providers: [FederationService, HttpSignaturesService, PostFederationService],
  exports: [FederationService, PostFederationService],
})
export class FederationModule {}
