import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { VisibilityModule } from '../common/visibility/visibility.module';
import { LoginSession } from '../auth/entities/login-session.entity';
import { UserResolver } from './resolvers/user.resolver';
import { PostResolver } from './resolvers/post.resolver';
import { GqlAuthGuard } from './guards/gql-jwt-auth.guard';

// Thin GraphQL passthrough: resolvers delegate to the existing REST services,
// so the graphql surface is a read-only projection of the same data. Mounted at
// /graphql alongside the REST API (no global prefix).
//
// Every resolver is behind `GqlAuthGuard`, and both resolvers re-apply
// `VisibilityService` rules, so /graphql cannot be used to read private
// accounts, blocked users, or non-public posts.
@Module({
  imports: [
    // `autoSchemaFile: true` builds the schema in memory from the code-first
    // resolvers and writes nothing. The previous `autoSchemaFile` target was
    // under `src/` (which broke read-only production containers) and then a
    // temp directory (which still wrote a file on every boot for no reason).
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      path: 'graphql',
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
    ConfigModule,
    UsersModule,
    PostsModule,
    VisibilityModule,
    TypeOrmModule.forFeature([LoginSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserResolver, PostResolver, GqlAuthGuard],
})
export class ZynkraGraphQLModule {}
