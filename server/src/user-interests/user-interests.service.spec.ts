import { UserInterestsService } from './user-interests.service';
import { User } from '../users/entities/user.entity';
import { PostVisibility } from '../posts/entities/post.entity';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-1',
    personalization: true,
    personalizationControls: {
      feedPersonalization: true,
      searchPersonalization: true,
      recommendations: true,
      notificationPersonalization: true,
      creatorPersonalization: true,
      communityPersonalization: true,
      shoppingPersonalization: true,
      eventPersonalization: true,
      locationPersonalization: true,
      activityPersonalization: true,
    },
    ...overrides,
  });
}

describe('UserInterestsService personalization controls', () => {
  const interestsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const tagsRepository = { findOne: jest.fn(), findByIds: jest.fn() };
  const postsRepository = { findAndCount: jest.fn() };
  const productsRepository = { findAndCount: jest.fn() };
  let service: UserInterestsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserInterestsService(
      interestsRepository as any,
      tagsRepository as any,
      postsRepository as any,
      productsRepository as any,
    );
  });

  it('does not learn activity when activity personalization is disabled', async () => {
    const user = makeUser({ personalizationControls: { activityPersonalization: false } as any });

    await service.recordInteraction(user, [{ id: 'tag-1' } as any], 'view');

    expect(interestsRepository.findOne).not.toHaveBeenCalled();
    expect(interestsRepository.save).not.toHaveBeenCalled();
  });

  it('returns chronological posts when recommendations are disabled', async () => {
    const posts = [{ id: 'post-1' }];
    postsRepository.findAndCount.mockResolvedValue([posts, 1]);

    const result = await service.getRecommendedPosts(
      makeUser({ personalizationControls: { recommendations: false } as any }),
      1,
      20,
    );

    expect(result.data).toEqual(posts);
    expect(postsRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: { visibility: PostVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
    }));
    expect(interestsRepository.find).not.toHaveBeenCalled();
  });

  it('returns recent products when shopping personalization is disabled', async () => {
    const products = [{ id: 'product-1' }];
    productsRepository.findAndCount.mockResolvedValue([products, 1]);

    const result = await service.getRecommendedProducts(
      makeUser({ personalizationControls: { shoppingPersonalization: false } as any }),
      1,
      20,
    );

    expect(result.data).toEqual(products);
    expect(productsRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    }));
    expect(interestsRepository.find).not.toHaveBeenCalled();
  });

  it('does not return similar interests when recommendations are disabled', async () => {
    const result = await service.getUserSimilarInterests(
      makeUser({ personalizationControls: { recommendations: false } as any }),
    );

    expect(result).toEqual([]);
    expect(interestsRepository.find).not.toHaveBeenCalled();
  });
});