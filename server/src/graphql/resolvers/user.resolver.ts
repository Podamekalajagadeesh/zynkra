import { Resolver, Query, Args, ObjectType, Field, ID, Context } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { VisibilityService } from '../../common/visibility/visibility.service';
import { GqlAuthGuard } from '../guards/gql-jwt-auth.guard';

@ObjectType()
export class GqlUser {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatar?: string;
}

@Resolver(() => GqlUser)
@UseGuards(GqlAuthGuard)
export class UserResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly visibilityService: VisibilityService
  ) {}

  @Query(() => GqlUser, { nullable: true })
  async user(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<GqlUser | null> {
    const viewerId: string = context?.req?.user?.userId;
    if (!viewerId) {
      throw new NotFoundException('User not found.');
    }

    // A block in either direction hides the user entirely, and a private
    // account is only visible to the owner and accepted followers. Returning
    // null (rather than throwing) keeps this consistent with the REST surface.
    if (await this.visibilityService.isBlockedEither(viewerId, id)) {
      return null;
    }
    if (!(await this.visibilityService.canViewAuthor(viewerId, id))) {
      return null;
    }

    const user = await this.usersService.findOneById(id);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username ?? undefined,
      displayName: user.displayName ?? undefined,
      bio: user.bio ?? undefined,
      avatar: user.avatar ?? undefined,
    };
  }
}
