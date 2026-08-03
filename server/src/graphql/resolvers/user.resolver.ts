import { Resolver, Query, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import { UsersService } from '../../users/users.service';

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
export class UserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => GqlUser, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: string): Promise<GqlUser | null> {
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
