# CONTRIBUTING.md
**Development Guidelines & Contribution Process**

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Git Workflow](#git-workflow)
5. [Pull Request Process](#pull-request-process)
6. [Testing Requirements](#testing-requirements)
7. [Commit Message Convention](#commit-message-convention)
8. [Code Review Checklist](#code-review-checklist)

---

## Getting Started

### 1. Fork & Clone
```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/zynkra.git
cd zynkra

# Add upstream remote
git remote add upstream https://github.com/Podamekalajagadeesh/zynkra.git
```

### 2. Create Development Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-number
```

### 3. Set Up Local Environment
```bash
# See DEVELOPMENT.md for full setup
cd server && npm install && npm run dev
cd ../client && npm install && npm run dev
```

### 4. Run Tests Before Starting
```bash
cd server && npm run test:unit && npm run test:qa
```

---

## Development Workflow

### Step 1: Understand the Issue
- Read the GitHub issue completely
- Check comments for context
- Ask questions if unclear (don't assume)
- Assign yourself to the issue

### Step 2: Design Before Coding
```markdown
# For significant features, create a design doc:

## Problem
What are we solving?

## Solution
High-level approach

## API Changes
New endpoints/functions?

## Database Changes
New tables/columns?

## Testing Strategy
How will we test this?
```

### Step 3: Implement Feature
- Write code incrementally (small, logical commits)
- Test as you go (don't write all code then test)
- Keep functions small & focused
- Add type definitions
- Add JSDoc comments for public APIs

### Step 4: Test Thoroughly
```bash
# Unit tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Manual testing
# 1. Test happy path
# 2. Test error cases
# 3. Test edge cases
# 4. Test with different data
```

### Step 5: Submit Pull Request
- Create PR with description
- Link to related issues
- Request review from 2+ team members
- Address feedback promptly

### Step 6: Deploy to Production
- After 2 approvals, PR is merged
- CI/CD pipeline runs tests
- Deployed to staging automatically
- Manual QA testing
- Deployed to production

---

## Code Standards

### TypeScript Standards

#### Type Everything
```typescript
// ✅ GOOD: Types are explicit
async function getUserPosts(userId: string): Promise<Post[]> {
  return db.posts.find({ userId })
}

// ❌ BAD: No types
async function getUserPosts(userId) {
  return db.posts.find({ userId })
}
```

#### Use Interfaces for Objects
```typescript
// ✅ GOOD: Clear contract
interface User {
  id: string
  username: string
  email: string
  createdAt: Date
}

// ❌ BAD: No structure
type User = any
```

#### Avoid `any` Type
```typescript
// ✅ GOOD: Specific type
function processData(data: Record<string, unknown>): void {}

// ❌ BAD: Too loose
function processData(data: any): void {}
```

### React Standards

#### Functional Components Only
```typescript
// ✅ GOOD: Functional with hooks
const UserCard: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])
  
  return <div>{user?.name}</div>
}

// ❌ BAD: Class components
class UserCard extends React.Component {}
```

#### Use Custom Hooks for Logic
```typescript
// ✅ GOOD: Custom hook encapsulates logic
const useUserPosts = (userId: string) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    setIsLoading(true)
    fetchUserPosts(userId).then(setPosts).finally(() => setIsLoading(false))
  }, [userId])
  
  return { posts, isLoading }
}

const UserTimeline: React.FC = ({ userId }) => {
  const { posts, isLoading } = useUserPosts(userId)
  return <div>{isLoading ? 'Loading...' : posts.map(p => <Post key={p.id} {...p} />)}</div>
}

// ❌ BAD: Logic in component
const UserTimeline: React.FC = ({ userId }) => {
  const [posts, setPosts] = useState<Post[]>([])
  useEffect(() => {
    fetchUserPosts(userId).then(setPosts)
  }, [userId])
  // ... 50 more lines of logic
}
```

#### Memoize When Needed
```typescript
// ✅ GOOD: Memoized to prevent unnecessary re-renders
const Post = memo(({ post }: { post: Post }) => {
  return <div>{post.content}</div>
})

// ✅ GOOD: useCallback for event handlers passed as props
const UserCard = ({ userId }: { userId: string }) => {
  const handleClick = useCallback(() => {
    trackEvent('user-card-click', { userId })
  }, [userId])
  
  return <div onClick={handleClick}>{userId}</div>
}
```

### NestJS Standards

#### Use Decorators Properly
```typescript
// ✅ GOOD: Decorators are clear
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}
  
  @Get(':id')
  @UseGuards(AuthGuard)
  async getPost(@Param('id') id: string): Promise<Post> {
    return this.postsService.findOne(id)
  }
  
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(ValidationPipe)
  async createPost(@Body() dto: CreatePostDto): Promise<Post> {
    return this.postsService.create(dto)
  }
}

// ❌ BAD: Mixed patterns
async getPost(req, res) {
  try {
    const post = await db.posts.find(req.params.id)
    res.send(post)
  } catch (e) {
    res.status(500).send(e)
  }
}
```

#### Separate Concerns
```typescript
// ✅ GOOD: Clear separation
// posts.controller.ts - handles HTTP
@Controller('posts')
export class PostsController {
  constructor(private service: PostsService) {}
  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}

// posts.service.ts - business logic
@Injectable()
export class PostsService {
  async findOne(id: string): Promise<Post> {
    return this.postsRepository.findOne(id)
  }
}

// posts.repository.ts - data access
@Injectable()
export class PostsRepository {
  async findOne(id: string): Promise<Post> {
    return this.db.query('SELECT * FROM posts WHERE id = $1', [id])
  }
}
```

### Styling Standards

#### Use Tailwind Classes
```tsx
// ✅ GOOD: Utility classes
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  <span className="text-lg font-semibold text-gray-900">{title}</span>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click me
  </button>
</div>

// ❌ BAD: Custom CSS
<div style={{ display: 'flex', ... }}>
  <span style={{ fontSize: '18px', ... }}>{title}</span>
</div>
```

#### Use CSS Modules for Complex Styles
```css
/* Post.module.css */
.container {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 1rem;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}
```

```tsx
import styles from './Post.module.css'

export const Post = () => (
  <div className={styles.container}>
    <img src={avatar} className={styles.avatar} />
    <div>{content}</div>
  </div>
)
```

---

## Git Workflow

### Branch Naming
```bash
# Features
git checkout -b feature/add-dark-mode
git checkout -b feature/ZYNKRA-123-dark-mode

# Bugfixes
git checkout -b bugfix/fix-post-deletion
git checkout -b bugfix/ZYNKRA-456-post-deletion-crash

# Chores
git checkout -b chore/update-dependencies
git checkout -b chore/refactor-post-service

# Hotfixes (production bugs)
git checkout -b hotfix/critical-security-issue
```

### Keeping Branch Up-to-Date
```bash
# Before submitting PR
git fetch upstream
git rebase upstream/main

# Force push if needed (only on your branch)
git push --force-with-lease origin feature/your-feature
```

### Squashing Commits (if needed)
```bash
# If you have multiple commits
git rebase -i upstream/main

# Mark commits as 'squash' to combine them
# Then force push
git push --force-with-lease origin feature/your-feature
```

---

## Pull Request Process

### 1. Create Detailed PR Description
```markdown
## Description
Brief summary of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Motivation & Context
Why is this change needed? What problem does it solve?

## Testing Done
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed
  - [ ] Happy path
  - [ ] Error cases
  - [ ] Edge cases

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Commits are descriptive

## Screenshots (if applicable)
Before/after UI screenshots

## Related Issues
Closes #123
Relates to #456
```

### 2. Request Reviewers
- Tag 2+ team members
- Add labels (backend, frontend, documentation, etc.)
- Link to issue

### 3. Address Feedback
- Respond to all comments
- Make requested changes
- Re-request review after changes
- Don't dismiss feedback without discussion

### 4. Final Approval
- Need 2+ approvals
- All CI checks must pass
- No conflicting changes
- Ready to merge

---

## Testing Requirements

### Unit Tests
```typescript
// ✅ GOOD: Test the service
describe('PostsService', () => {
  let service: PostsService
  let repository: PostsRepository
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostsService, { provide: PostsRepository, useValue: {} }],
    }).compile()
    
    service = module.get(PostsService)
    repository = module.get(PostsRepository)
  })
  
  it('should create a post', async () => {
    const dto = { content: 'Test post', userId: '123' }
    repository.create = jest.fn().mockResolvedValue({ id: '456', ...dto })
    
    const result = await service.create(dto)
    
    expect(result.id).toBe('456')
    expect(repository.create).toHaveBeenCalledWith(dto)
  })
})
```

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

describe('PostCard', () => {
  it('should render post content', () => {
    const post = { id: '1', content: 'Hello world' }
    render(<PostCard post={post} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })
  
  it('should call onDelete when delete button is clicked', () => {
    const post = { id: '1', content: 'Hello' }
    const onDelete = jest.fn()
    render(<PostCard post={post} onDelete={onDelete} />)
    
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
```

### Test Coverage
- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 60%+ coverage (components harder to test)
- **Critical paths**: 100% coverage (auth, payments, security)

---

## Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Example
```
feat(posts): add ability to edit posts

Allow users to edit their posts within 5 minutes of creation.
Editing history is tracked and displayed to readers.

Closes #123
Breaking change: None
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (spacing, semicolons, etc.)
- **refactor**: Code refactoring without feature change
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Build, dependencies, etc.

### Rules
- First line: max 50 characters
- Body: wrapped at 72 characters
- Reference issues: "Closes #123" or "Fixes #456"
- Be descriptive but concise

---

## Code Review Checklist

### For Reviewers

#### Functionality
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Are error cases handled?
- [ ] Is error handling correct?

#### Code Quality
- [ ] Is code readable and maintainable?
- [ ] Are functions/methods focused and small?
- [ ] Is there unnecessary complexity?
- [ ] Can it be simplified?

#### Testing
- [ ] Are tests added/updated?
- [ ] Do tests cover happy path AND error cases?
- [ ] Are tests meaningful (not just boilerplate)?

#### Security
- [ ] No hardcoded secrets or tokens?
- [ ] Input validation present?
- [ ] Authentication/authorization correct?
- [ ] SQL injection protection?
- [ ] XSS protection?

#### Performance
- [ ] No obvious performance issues?
- [ ] Database queries optimized?
- [ ] No N+1 query problems?
- [ ] Caching used appropriately?

#### Documentation
- [ ] Comments explain WHY, not WHAT?
- [ ] JSDoc added for public APIs?
- [ ] Database schema updated?
- [ ] README updated if needed?

### For Authors

Before requesting review:
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code is formatted with Prettier
- [ ] Commits are logical and descriptive
- [ ] No debugging code left (console.log, etc.)
- [ ] PR description is clear
- [ ] Related issues are linked

---

## Common Mistakes to Avoid

### ❌ Don't:
- Commit directly to `main` (use branches)
- Leave debugging code (console.log, debugger)
- Write overly complex functions (>20 lines)
- Forget to update tests
- Use `any` type in TypeScript
- Create massive PRs (>500 lines = hard to review)
- Commit secrets/API keys
- Use hardcoded values (use config files)
- Ignore TypeScript errors
- Leave TODO comments without issues

### ✅ Do:
- Use descriptive branch names
- Write small, focused functions
- Add tests for new code
- Use proper types
- Keep PRs reasonably sized
- Reference issues in commits
- Explain complex logic with comments
- Use environment variables for config
- Fix all TypeScript errors
- Create issues for TODOs

---

## Getting Help

- **Questions?** Open a GitHub discussion
- **Found a bug?** Open an issue with reproduction steps
- **Need design feedback?** Post in discussions before coding
- **Stuck?** Ask in comments (don't be silent)
- **Need help?** @mention team leads

---

**Let's build Zynkra together! 🚀**
