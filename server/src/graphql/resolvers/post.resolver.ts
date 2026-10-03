import { Resolver, Query, Args, ObjectType, Field, ID, Int, Context, UseGuards } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from '../../posts/posts.service';
import { PostVisibility } from '../../posts/entities/post.entity';
import { VisibilityService } from '../../common/visibility/visibility.service';
import { GqlAuthGuard } from '../guards/gql-jwt-auth.guard';

@ObjectType()
export class GqlPostAuthor {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  username?: string;
}

@ObjectType()
export class GqlPost {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => Int, { nullable: true })
  viewCount?: number;

  @Field({ nullable: true })
  createdAt?: string;

  @Field(() => GqlPostAuthor, { nullable: true })
  author?: GqlPostAuthor;

  @Field({ nullable: true })
  sensitiveLocked?: boolean;
}

@Resolver(() => GqlPost)
@UseGuards(GqlAuthGuard)
export class PostResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly visibilityService: VisibilityService,
  ) {}

  @Query(() => GqlPost, { nullable: true })
  async post(@Args('id', { type: () => ID }) id: string, @Context() context: any): Promise<GqlPost | null> {
    const viewerId: string = context?.req?.user?.userId;
    if (!viewerId) {
      throw new NotFoundException('Post not found.');
    }

    const post = await this.postsService.findOne(id, viewerId);
    if (!post) {
      return null;
    }

    // Defence in depth: `findOne` is viewer-aware, but the GraphQL surface must
    // not depend on that being true for every future edit. Re-apply the block
    // and post-visibility rules here, and 404 (not 403) so a private post does
    // not leak its existence.
    if (post.user?.id) {
      if (await this.visibilityService.isBlockedEither(viewerId, post.user.id)) {
        throw new NotFoundException('Post not found.');
      }
      if (!(await this.visibilityService.canViewAuthor(viewerId, post.user.id))) {
        throw new NotFoundException('Post not found.');
      }
    }

    if (viewerId !== post.user?.id && post.visibility !== PostVisibility.PUBLIC) {
      // Non-public posts are only served over the REST feed, which applies
      // mutual-follow rules. GraphQL is a public-post projection.
      throw new NotFoundException('Post not found.');
    }

    return {
      id: post.id,
      content: post.content ?? undefined,
      viewCount: post.viewCount ?? undefined,
      createdAt: post.createdAt?.toISOString(),
      author: post.user
        ? { id: post.user.id, username: post.user.username ?? undefined }
        : undefined,
      sensitiveLocked: post.sensitiveLocked,
    };
  }
}
