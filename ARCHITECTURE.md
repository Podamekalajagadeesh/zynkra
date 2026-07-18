# ARCHITECTURE.md
**System Design, Tech Stack, and Module Structure**

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Backend Module Structure](#backend-module-structure)
5. [Frontend Architecture](#frontend-architecture)
6. [Real-Time Communication](#real-time-communication)
7. [Security & Encryption](#security--encryption)
8. [Performance Considerations](#performance-considerations)

---

## Tech Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 | UI library |
| **Build Tool** | Vite | Fast bundler & dev server |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State** | React Context + Hooks | State management |
| **HTTP Client** | Axios/Fetch API | API calls |
| **Real-time** | Socket.io Client | WebSocket communication |
| **Testing** | Vitest + React Testing Lib | Unit & component tests |
| **Code Quality** | ESLint + Prettier | Linting & formatting |
| **Crypto** | libsodium.js | E2EE |
| **Offline** | IndexedDB + Service Workers | Offline-first support |

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS | Scalable server framework |
| **Language** | TypeScript | Type safety |
| **Database** | PostgreSQL 14+ | Relational data store |
| **ORM** | TypeORM | Database abstraction |
| **API** | REST + GraphQL (optional) | API endpoints |
| **Real-time** | Socket.io | WebSocket server |
| **Authentication** | JWT | Token-based auth |
| **Validation** | class-validator | Input validation |
| **Testing** | Jest | Unit & integration tests |
| **Caching** | Redis (optional) | In-memory cache |
| **Job Queue** | Bull (optional) | Background jobs |
| **File Storage** | AWS S3 or local | Media storage |

### Infrastructure
| Service | Technology | Purpose |
|---------|-----------|---------|
| **Messaging** | Socket.io | Real-time DMs, notifications |
| **Media** | LiveKit | Video/voice calls |
| **Federation** | ActivityPub | Decentralized social |
| **Storage** | IPFS | Decentralized content |
| **Blockchain** | Ethereum / Polygon | Identity, payments |
| **Search** | Meilisearch (optional) | Full-text search |
| **Email** | SendGrid / SMTP | Transactional email |

---

## System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
└──────────────┬──────────────────────────────────────┬────────┘
               │                                      │
       ┌───────▼──────┐                      ┌────────▼─────┐
       │   Frontend    │                      │  Mobile Apps  │
       │  (React/Vite) │◄────────────────────►│  (React N.)   │
       └───────┬──────┘                      └────────┬─────┘
               │                                      │
         HTTP │ WebSocket                            │
               └──────────────┬─────────────────────┬┘
                              │
                    ┌─────────▼──────────┐
                    │   API Gateway      │
                    │  (NestJS Server)   │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼──────┐       ┌─────▼────┐
   │  REST   │          │  WebSocket │       │ GraphQL  │
   │ Routes  │          │  Server    │       │  (opt.)  │
   └────┬────┘          └─────┬──────┘       └─────┬────┘
        │                     │                     │
        └──────────┬──────────┴────────────┬────────┘
                   │                       │
            ┌──────▼───────┐       ┌───────▼──────┐
            │  PostgreSQL   │       │  Redis Cache │
            │   Database    │       │   (optional) │
            └───────────────┘       └──────────────┘
                   ▲
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐         ┌────▼─────┐
   │ IPFS/Web3 │         │ActivityPub│
   │ Integration         │Federation │
   └──────────┘         └──────────┘
```

### Request Flow
```
Client Request
    │
    ├─► HTTP/WebSocket Listener
    │
    ├─► Guard (Authentication, Authorization)
    │
    ├─► Controller (Route handling)
    │
    ├─► Service (Business logic)
    │
    ├─► Repository (Database access)
    │
    ├─► PostgreSQL (Persistence)
    │
    └─► Response back to Client
```

---

## Database Schema

### Core Tables
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of S3/IPFS URLs
  is_encrypted BOOLEAN DEFAULT false,
  encrypted_key VARCHAR, -- For E2EE
  visibility VARCHAR DEFAULT 'public', -- public, private, followers
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Reactions (likes, etc.)
CREATE TABLE reactions (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  reaction_type VARCHAR, -- 'like', 'love', 'haha', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Followers
CREATE TABLE follows (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Direct Messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  encrypted_key VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (DM threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_1_id UUID REFERENCES users(id),
  user_2_id UUID REFERENCES users(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_dms_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_dms_recipient_id ON direct_messages(recipient_id);
CREATE INDEX idx_users_username ON users(username);
```

---

## Backend Module Structure

### Core Modules

#### 1. **Users Module** (`src/users/`)
Handles user accounts, profiles, authentication.
```
users/
├── users.controller.ts      # Routes: GET /users, POST /users, GET /users/:id
├── users.service.ts         # Business logic: signup, login, profile update
├── users.entity.ts          # Database model
├── users.dto.ts             # Data validation
└── users.module.ts          # Module definition
```

#### 2. **Auth Module** (`src/auth/`)
Handles authentication (JWT, OAuth, login/signup).
```
auth/
├── auth.controller.ts       # Routes: POST /auth/login, POST /auth/register
├── auth.service.ts          # JWT generation, password hashing
├── jwt.strategy.ts          # JWT validation
├── auth.guard.ts            # @UseGuards(AuthGuard) decorator
└── auth.module.ts
```

#### 3. **Posts Module** (`src/posts/`)
Handles post creation, editing, deletion.
```
posts/
├── posts.controller.ts      # Routes: GET /posts, POST /posts, DELETE /posts/:id
├── posts.service.ts         # CRUD operations, feed generation
├── posts.entity.ts          # Post model
├── posts.dto.ts             # CreatePostDto, UpdatePostDto
└── posts.module.ts
```

#### 4. **Comments Module** (`src/comments/`)
Handles comments on posts.
```
comments/
├── comments.controller.ts   # Routes for comments
├── comments.service.ts      # Comment CRUD
├── comments.entity.ts       # Comment model
└── comments.module.ts
```

#### 5. **Reactions Module** (`src/reactions/`)
Handles likes, reactions, etc.
```
reactions/
├── reactions.controller.ts  # POST /posts/:id/reactions
├── reactions.service.ts     # Toggle reactions
└── reactions.module.ts
```

#### 6. **DMs Module** (`src/dms/`)
Handles direct messaging with E2EE.
```
dms/
├── dms.controller.ts        # Routes: GET /dms, POST /dms
├── dms.service.ts           # Message CRUD, encryption
├── dms.entity.ts            # Message & Conversation models
└── dms.module.ts
```

#### 7. **Feed Module** (`src/feed/`)
Handles feed algorithms (FYP, chronological, following).
```
feed/
├── feed.controller.ts       # GET /feed/home, GET /feed/discover
├── feed.service.ts          # Algorithm logic
└── feed.module.ts
```

#### 8. **Follows Module** (`src/follows/`)
Handles follow/unfollow relationships.
```
follows/
├── follows.controller.ts    # POST /users/:id/follow
├── follows.service.ts       # Follow/unfollow logic
└── follows.module.ts
```

### Commerce Modules

#### 9. **Payments Module** (`src/payments/`)
Handles payments, creator payouts.
```
payments/
├── payments.controller.ts
├── payments.service.ts      # Stripe integration, payout logic
├── transaction.entity.ts    # Transaction records
└── payments.module.ts
```

#### 10. **Marketplace Module** (`src/marketplace/`)
Handles product listings, sales.
```
marketplace/
├── marketplace.controller.ts
├── marketplace.service.ts
├── product.entity.ts
└── marketplace.module.ts
```

### Advanced Modules

#### 11. **Crypto Module** (`src/crypto/`)
Handles blockchain, wallets, NFTs.

#### 12. **ActivityPub Module** (`src/federation/`)
Handles federation with other servers (Mastodon, Pixelfed).

#### 13. **IPFS Module** (`src/ipfs/`)
Handles decentralized storage.

#### 14. **Notifications Module** (`src/notifications/`)
Handles WebSocket notifications, notifications feed.

---

## Frontend Architecture

### Component Hierarchy
```
App
├── Layouts/
│   ├── MainLayout
│   │   ├── Sidebar (navigation)
│   │   ├── MainContent
│   │   └── RightSidebar (suggestions, trending)
│   └── AuthLayout
├── Pages/
│   ├── HomePage
│   ├── ProfilePage
│   ├── SearchPage
│   ├── NotificationsPage
│   └── SettingsPage
├── Components/
│   ├── Post (display single post)
│   ├── PostCreate (create new post)
│   ├── Comment (display comment)
│   ├── UserCard (user profile summary)
│   ├── FollowButton (follow/unfollow)
│   └── etc.
└── Contexts/
    ├── AuthContext (current user, login state)
    ├── ThemeContext (dark/light mode)
    └── NotificationContext (toast messages)
```

### State Management
```typescript
// Using React Context + Hooks (no Redux needed)

// AuthContext - manages authentication state
const { user, login, logout } = useAuth()

// Fetch data from API
const [posts, setPosts] = useState([])
useEffect(() => {
  fetchPosts().then(setPosts)
}, [])

// Local UI state
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

### File Structure
```
client/src/
├── components/           # Reusable React components
│   ├── Post/
│   │   ├── Post.tsx      # Component JSX
│   │   ├── Post.module.css
│   │   └── usePost.ts    # Custom hook
│   ├── UserCard/
│   ├── FollowButton/
│   └── etc.
├── pages/               # Full-page routes
│   ├── HomePage.tsx
│   ├── ProfilePage.tsx
│   ├── SearchPage.tsx
│   └── etc.
├── services/            # API clients
│   ├── postsService.ts   # API calls for posts
│   ├── usersService.ts
│   ├── dmsService.ts
│   └── etc.
├── contexts/            # React Context
│   ├── AuthContext.tsx   # Auth state
│   ├── ThemeContext.tsx  # Theme state
│   └── etc.
├── hooks/               # Custom React hooks
│   ├── useFetch.ts       # Generic fetch hook
│   ├── useAuth.ts        # Auth hook
│   ├── usePagination.ts
│   └── etc.
├── types/               # TypeScript types
│   ├── user.ts
│   ├── post.ts
│   ├── comment.ts
│   └── etc.
├── lib/                 # Utilities
│   ├── encryption.ts     # E2EE logic
│   ├── validation.ts
│   └── etc.
└── App.tsx              # Main app component
```

---

## Real-Time Communication

### WebSocket Architecture
```
┌──────────────┐              ┌──────────────────────┐
│  Client 1    │              │   NestJS Server      │
│  (Socket.io) │◄────────────►│   (Socket.io)        │
│              │   WebSocket  │                      │
└──────────────┘              └──────────────────────┘
                                       │
        ┌──────────────┐              │
        │  Client 2    │              │
        │  (Socket.io) │◄─────────────┘
        │              │
        └──────────────┘
```

### Socket Events
```typescript
// Frontend sends
socket.emit('post:create', { content: 'Hello!' })
socket.emit('post:like', { postId: '123' })
socket.emit('message:send', { content: 'Hi', recipientId: '456' })

// Backend broadcasts
socket.on('post:created', (post) => {})
socket.on('post:liked', (post) => {})
socket.on('message:received', (message) => {})
socket.on('user:online', (user) => {})
socket.on('notification', (notification) => {})
```

---

## Security & Encryption

### Authentication Flow
```
1. User registers
   ├─ Hash password with bcrypt
   └─ Store in database

2. User logs in
   ├─ Validate username/password
   ├─ Generate JWT token
   └─ Return token to client

3. Client sends requests
   ├─ Include token in Authorization header
   ├─ Server validates JWT
   └─ Allow/deny request

4. Token expires
   ├─ Client gets 401 Unauthorized
   ├─ User redirected to login
   └─ Refresh token for new session (optional)
```

### End-to-End Encryption (E2EE)
```typescript
// Sending a DM
const message = "Secret message"
const publicKey = getRecipientPublicKey()

// Encrypt with recipient's public key
const encrypted = await encrypt(message, publicKey)

// Send encrypted to server (server can't read it)
await sendDM({ 
  content: encrypted,
  recipientId: '456'
})

// Receiving a DM
const encryptedMessage = await receiveDM()
const privateKey = getUserPrivateKey() // Only user has this

// Decrypt with user's private key
const decrypted = await decrypt(encryptedMessage, privateKey)
// Only this user can read the message
```

### Stored Keys
```typescript
// User's keypair stored locally (browser storage)
localStorage.setItem('privateKey', privateKey)
sessionStorage.setItem('publicKey', publicKey)

// Server stores only public key
users.publicKey = publicKey
```

---

## Performance Considerations

### Frontend Optimization
```typescript
// 1. Code Splitting - Load pages lazily
const HomePage = lazy(() => import('./pages/HomePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// 2. Memoization - Prevent unnecessary re-renders
const Post = memo(({ post }) => (...))

// 3. Pagination - Load posts in batches
const [page, setPage] = useState(1)
const posts = await fetchPosts({ page, limit: 20 })

// 4. Caching - Cache data locally
const cache = new Map()
async function fetchPostsWithCache(id) {
  if (cache.has(id)) return cache.get(id)
  const data = await fetchPosts(id)
  cache.set(id, data)
  return data
}

// 5. Image optimization - Use progressive JPEGs, WebP
<img src="post.webp" alt="Post" loading="lazy" />
```

### Backend Optimization
```typescript
// 1. Database Queries - Use indexes and pagination
const posts = await db.posts
  .find({ userId })
  .limit(20)
  .skip((page - 1) * 20)

// 2. Caching - Cache frequently accessed data
@Cacheable({ ttl: 3600 })
async getPopularPosts() { ... }

// 3. Connection Pooling - Reuse DB connections
// TypeORM handles this automatically

// 4. Batch Operations - Process multiple items at once
await db.posts.save([post1, post2, post3])

// 5. Async Processing - Don't block on slow operations
// Use job queue for sending emails, transcoding videos
await emailQueue.add({ userId, email })
```

### Monitoring & Profiling
```bash
# Frontend bundle analysis
npm run build
npm run analyze

# Backend performance logging
# Check slow database queries
# Monitor API response times
# Track error rates
```

---

## Deployment Architecture

### Production Setup (Simplified)
```
┌─────────────────────────────────────────┐
│         CloudFlare CDN                  │
│     (Static assets caching)             │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼─────┐         ┌──────▼────┐
│ Frontend  │         │ Backend    │
│ (React)   │         │ (NestJS)   │
│ on Vercel │         │ on Heroku  │
└──────────┘         │ or Railway │
                      └──────┬─────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (RDS/Managed) │
                    └─────────────────┘
```

---

## Next Steps

1. **Frontend Setup**: See `client/README.md`
2. **Backend Setup**: See `server/README.md`
3. **Database**: Run migrations
4. **Testing**: Write unit tests for new features
5. **Deployment**: Set up CI/CD pipelines

---

**See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards and best practices.**
