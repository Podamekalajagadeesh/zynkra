import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { UserResolver } from './resolvers/user.resolver';
import { PostResolver } from './resolvers/post.resolver';

// Thin GraphQL passthrough: resolvers delegate to the existing REST services,
// so the graphql surface is a read-only projection of the same data. Mounted at
// /graphql alongside the REST API (no global prefix).
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      path: 'graphql',
      playground: process.env.NODE_ENV !== 'production',
    }),
    UsersModule,
    PostsModule,
  ],
  providers: [UserResolver, PostResolver],
})
export class ZynkraGraphQLModule {}
