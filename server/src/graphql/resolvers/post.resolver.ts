import { Resolver, Query, Args, ObjectType, Field, ID, Int, Context } from '@nestjs/graphql';
import { PostsService } from '../../posts/posts.service';

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
export class PostResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => GqlPost, { nullable: true })
  async post(@Args('id', { type: () => ID }) id: string, @Context() context: any): Promise<GqlPost | null> {
    const viewerId = context?.req?.user?.userId ?? context?.req?.user?.id;
    const post = await this.postsService.findOne(id, viewerId);
    if (!post) {
      return null;
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
