# API_DOCUMENTATION.md
**Backend API Reference & Endpoints**

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Posts](#posts)
4. [Comments](#comments)
5. [Reactions](#reactions)
6. [Direct Messages](#direct-messages)
7. [Feed](#feed)
8. [Follows](#follows)
9. [Media / Uploads](#media--uploads)
10. [Search](#search)
11. [Payments, Wallet & Payouts](#payments-wallet--payouts)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)

---

## Base URL
```
http://localhost:3000
```

The server does not use a global `/api` prefix. Interactive documentation is
available at `http://localhost:3000/docs`, and the machine-readable OpenAPI
document is available at `http://localhost:3000/documentation/openapi.json`.

## Testing & QA

The backend now includes runnable smoke tests and a QA helper script:

```bash
cd server
npm run test:unit
npm run test:qa
npm run qa:check
```

Use these commands before release validation or deployment to verify the API surface and basic release readiness.

### Release validation checklist
- Run the server QA suite before each release candidate.
- Run the client offline smoke check and build before shipping the web client.
- Generate an internal mobile beta build and attach the release notes from the mobile build artifacts.

## Authentication

All endpoints (except `/auth/*`) require a JWT token in the Authorization header:

```bash
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password_123"
}
```

**Response (201)**:
```json
{
  "id": "user-123",
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password_123"
}
```

**Response (200)**:
```json
{
  "id": "user-123",
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

## Users

### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "user-123",
  "username": "john_doe",
  "email": "john@example.com",
  "bio": "Software engineer",
  "avatar": "https://...",
  "followerCount": 150,
  "followingCount": 75,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get User by ID
```http
GET /users/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "user-456",
  "username": "jane_smith",
  "bio": "Designer",
  "avatar": "https://...",
  "followerCount": 500,
  "followingCount": 200,
  "createdAt": "2024-01-10T14:22:00Z",
  "isFollowing": true
}
```

### Update User Profile
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "avatar": "https://new-avatar.jpg"
}
```

**Response (200)**:
```json
{
  "id": "user-123",
  "username": "john_doe",
  "bio": "Updated bio",
  "avatar": "https://new-avatar.jpg"
}
```

### Search Users
```http
GET /users/search?q=john
Authorization: Bearer <token>
```

**Query Parameters**:
- `q` (string): Search query
- `limit` (number, default 20): Results per page
- `page` (number, default 1): Page number

**Response (200)**:
```json
{
  "users": [
    {
      "id": "user-123",
      "username": "john_doe",
      "avatar": "https://...",
      "isFollowing": false
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## Posts

### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello world! 👋",
  "media": [
    "https://s3.example.com/image1.jpg",
    "https://s3.example.com/image2.jpg"
  ],
  "visibility": "public"
}
```

**Response (201)**:
```json
{
  "id": "post-789",
  "userId": "user-123",
  "content": "Hello world! 👋",
  "media": ["https://..."],
  "visibility": "public",
  "likeCount": 0,
  "commentCount": 0,
  "createdAt": "2024-07-04T12:00:00Z"
}
```

### Get Post
```http
GET /posts/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "post-789",
  "userId": "user-123",
  "user": {
    "id": "user-123",
    "username": "john_doe",
    "avatar": "https://..."
  },
  "content": "Hello world! 👋",
  "media": ["https://..."],
  "likeCount": 42,
  "commentCount": 8,
  "isLiked": true,
  "isBookmarked": false,
  "createdAt": "2024-07-04T12:00:00Z"
}
```

### Update Post
```http
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content"
}
```

**Response (200)**:
```json
{
  "id": "post-789",
  "content": "Updated content",
  "updatedAt": "2024-07-04T12:30:00Z"
}
```

### Delete Post
```http
DELETE /posts/:id
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Post deleted successfully"
}
```

### Get User's Posts
```http
GET /posts/users/:userId?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "posts": [
    {
      "id": "post-789",
      "content": "Hello world!",
      "likeCount": 42,
      "commentCount": 8,
      "createdAt": "2024-07-04T12:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### Bookmark Post
```http
POST /posts/:id/bookmark
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Post bookmarked",
  "isBookmarked": true
}
```

### Unbookmark Post
```http
DELETE /posts/:id/bookmark
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Post unbookmarked",
  "isBookmarked": false
}
```

---

## Comments

### Create Comment
```http
POST /posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great post! 👍"
}
```

**Response (201)**:
```json
{
  "id": "comment-001",
  "postId": "post-789",
  "userId": "user-123",
  "content": "Great post! 👍",
  "likeCount": 0,
  "createdAt": "2024-07-04T12:15:00Z"
}
```

### Get Comments for Post
```http
GET /posts/:postId/comments?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "comments": [
    {
      "id": "comment-001",
      "userId": "user-456",
      "user": {
        "username": "jane_smith",
        "avatar": "https://..."
      },
      "content": "Great post! 👍",
      "likeCount": 5,
      "isLiked": false,
      "createdAt": "2024-07-04T12:15:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

### Update Comment
```http
PUT /comments/:commentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment"
}
```

**Response (200)**:
```json
{
  "id": "comment-001",
  "content": "Updated comment",
  "updatedAt": "2024-07-04T12:20:00Z"
}
```

### Delete Comment
```http
DELETE /comments/:commentId
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Comment deleted successfully"
}
```

---

## Reactions

### Like Post
```http
POST /posts/:postId/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "like"
}
```

**Response (201)**:
```json
{
  "id": "reaction-001",
  "postId": "post-789",
  "userId": "user-123",
  "type": "like",
  "createdAt": "2024-07-04T12:10:00Z"
}
```

### Unlike Post
```http
DELETE /posts/:postId/reactions/:reactionId
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Reaction removed"
}
```

### Like Comment
```http
POST /comments/:commentId/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "like"
}
```

**Response (201)**:
```json
{
  "id": "reaction-002",
  "commentId": "comment-001",
  "userId": "user-123",
  "type": "like",
  "createdAt": "2024-07-04T12:12:00Z"
}
```

---

## Direct Messages

### Send Message
```http
POST /dms
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "user-456",
  "content": "Hi there! 👋"
}
```

**Response (201)**:
```json
{
  "id": "message-001",
  "senderId": "user-123",
  "recipientId": "user-456",
  "content": "Hi there! 👋",
  "isRead": false,
  "createdAt": "2024-07-04T12:00:00Z"
}
```

> **Note:** `content` is stored as received. For 1:1 conversations the client may encrypt
> before send (Signal Protocol); the server does not enforce E2EE. Group messages are
> currently plaintext server-side (transport uses TLS).

### Get Conversation
```http
GET /dms/conversations/:userId?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "messages": [
    {
      "id": "message-001",
      "senderId": "user-123",
      "recipientId": "user-456",
      "content": "Hi there!",
      "isRead": true,
      "createdAt": "2024-07-04T12:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### Mark Message as Read
```http
PUT /dms/:messageId/read
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": "message-001",
  "isRead": true
}
```

### Delete Message
```http
DELETE /dms/:messageId
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "Message deleted successfully"
}
```

---

## Feed

### Get Home Feed
```http
GET /feed?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "posts": [
    {
      "id": "post-789",
      "userId": "user-456",
      "user": {
        "username": "jane_smith",
        "avatar": "https://..."
      },
      "content": "Check this out!",
      "likeCount": 42,
      "commentCount": 8,
      "isLiked": false,
      "createdAt": "2024-07-04T12:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

### Get Discover/Explore Feed
```http
GET /feed/discover?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "posts": [
    {
      "id": "post-999",
      "user": {
        "username": "trending_creator",
        "avatar": "https://..."
      },
      "content": "Viral post",
      "likeCount": 5000,
      "commentCount": 800,
      "createdAt": "2024-07-04T10:00:00Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20
}
```

### Get Following Feed
```http
GET /feed/following?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "posts": [
    {
      "id": "post-789",
      "user": {
        "username": "followed_user",
        "avatar": "https://..."
      },
      "content": "New post from someone I follow",
      "createdAt": "2024-07-04T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## Follows

### Follow User
```http
POST /users/:userId/follow
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "User followed successfully",
  "isFollowing": true
}
```

### Unfollow User
```http
DELETE /users/:userId/follow
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "message": "User unfollowed successfully",
  "isFollowing": false
}
```

### Get User's Followers
```http
GET /users/:userId/followers?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "followers": [
    {
      "id": "user-123",
      "username": "john_doe",
      "avatar": "https://...",
      "isFollowing": true
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### Get User's Following
```http
GET /users/:userId/following?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "following": [
    {
      "id": "user-456",
      "username": "jane_smith",
      "avatar": "https://...",
      "isFollowing": true
    }
  ],
  "total": 75,
  "page": 1,
  "limit": 20
}
```

---

## Media / Uploads

Local-disk backend (`UPLOAD_DIR`, default `./uploads`). Files are served at
`GET /uploads/…`. Optional `CDN_BASE_URL` rewrites public URLs to a CDN origin.

Client flow for posts: upload first → pass `{ id, url, type }` to `POST /posts`.

### Upload media (posts, DMs, general)
```http
POST /media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<binary>
```

**Limits:** image ≤ 10MB, video ≤ 100MB, audio ≤ 20MB. Only `image/*`, `video/*`, `audio/*`.

**Response (201)**:
```json
{
  "id": "media-uuid",
  "url": "/uploads/images/a1b2….jpg",
  "type": "image",
  "width": 1920,
  "height": 1080,
  "size": 245000,
  "mimeType": "image/jpeg"
}
```

### Upload processed image (resize/optimize via sharp)
```http
POST /media/upload/image?maxWidth=2048&quality=85&format=webp
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<binary>
```

### Upload avatar
```http
POST /users/me/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<binary>   # image/*, ≤ 5MB
```

Also available via `PATCH /users/profile` with FormData field `avatar`.

### Upload story media
```http
POST /stories
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<binary>   # image/* or video/*, ≤ 50MB
```

### Delete owned media
```http
DELETE /media/:id
Authorization: Bearer <token>
```

---

## Search

Postgres full-text search over users, posts, hashtags, places, groups, events, and products.
Uses `searchVector` tsvector columns (GIN-indexed) with `websearch_to_tsquery` + `ts_rank`,
plus ILIKE fallback for partial matches. All endpoints require a JWT.

### Basic search
```http
GET /search?q=hello world
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "users": [],
  "posts": [],
  "hashtags": [],
  "places": [],
  "groups": [],
  "events": [],
  "products": []
}
```

### Advanced search (filter by type)
```http
GET /search/advanced?q=hello&type=posts&sort=relevance&limit=20&offset=0
Authorization: Bearer <token>
```

- `type`: `users` | `posts` | `hashtags` | `places` | `groups` | `events` | `products`
- `sort` (posts): `relevance` | `date` | `popularity`

### Follow-up search
```http
POST /search/follow-up
Authorization: Bearer <token>
Content-Type: application/json

{ "previousQuery": "cats", "followUpQuery": "videos" }
```

### Web search (DuckDuckGo Instant Answer)
```http
GET /search/web?q=nestjs
Authorization: Bearer <token>
```

### Reverse image search (Preview)
```http
POST /search/reverse-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image=<binary>
```

Returns recent public posts that have images. Perceptual/ML reverse-image matching is **not** implemented.

### Image + text search
```http
POST /search/image-text?q=cats
Authorization: Bearer <token>
Content-Type: multipart/form-data

image=<binary>
```

---

## Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Email must be a valid email address"
  }
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not allowed) |
| 404 | Not Found |
| 409 | Conflict (e.g., username taken) |
| 500 | Internal Server Error |

### Common Errors

**Missing Token**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Missing authorization token"
}
```

**Invalid Token**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

**Not Found**:
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Post not found"
}
```

**Validation Error**:
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "details": [
    {
      "field": "content",
      "message": "Content must not be empty"
    }
  ]
}
```

---

## Rate Limiting

A single global limiter runs on every HTTP request, keyed **per IP address**:

```
- 300 requests per minute per IP
```

Sensitive endpoints declare stricter `@Throttle` overrides:
- auth routes (signup, signin, 2FA, passkeys, recovery, session approval): **100/min**
- email-sending routes (forgot-password, magic-link, verification resend): **50 per 5 min**
- AI content routes: **30/min**; AI chat: **15/min**

WebSocket namespaces are **not** rate limited — the throttler guard is a no-op for
non-HTTP execution contexts. Abuse control on sockets is left to the gateway.

There are **no `X-RateLimit-*` response headers**; the limiter only returns `429`
when a bucket is exhausted.

Per-endpoint buckets (in addition to the global 300/min):

| Route | Limit |
|---|---|
| `POST /auth/refresh` | 20/min (token exchange) |
| `POST /auth/verify-code` | 10/min (6-digit code redemption) |
| auth signin / signup / 2FA / passkeys / recovery | 100/min |
| email-sending routes | 50 per 5 min |
| `POST /ai/content/*` | 30/min; AI chat 15/min |

If exceeded:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## CSRF Protection

Most routes authenticate with a **bearer token**, which a browser does not attach
automatically — so they are not CSRF-able and need nothing extra.

Three flows are authenticated *only* by the session cookie, and therefore require a
CSRF token:

| Route | Session value it protects |
|---|---|
| `POST /auth/webauthn/registration/verify` | WebAuthn registration challenge |
| `POST /auth/webauthn/authentication/verify` | WebAuthn authentication challenge |
| `POST /siwe/verify` | SIWE nonce |
| `POST /wallet/connect` | wallet-link nonce |

**Get a token** from any of:

```
GET /auth/csrf-token     → { "token": "<64 hex chars>" }
GET /siwe/nonce          → sets the X-CSRF-Token response header
GET /wallet/connect/challenge  → sets the X-CSRF-Token response header
```

The token is also mirrored into a **JS-readable** cookie (`zynkra.csrf` by default),
which is safe — a cross-site page cannot read another origin's cookies.

**Send it back** on the unsafe request:

```bash
curl -X POST http://localhost:3000/siwe/verify \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <token>' \
  -c cookies.txt -b cookies.txt \
  -d '{"message":"...","signature":"..."}'
```

Requests with an `Authorization: Bearer ...` header, and `GET`/`HEAD`/`OPTIONS`,
skip the check. A missing or wrong token returns `403`. Set
`CSRF_PROTECTION_ENABLED=false` to disable.

---

---

## WebSocket Events (Real-Time)

### Authentication (required)

Every Socket.IO namespace except the public read-only ones (`/trends`) requires an
access token in the handshake. Identity is derived from the verified JWT and the
backing `LoginSession` — **never** from a client-supplied `userId`. Sockets whose
token is missing, expired, or whose session has been revoked are disconnected on
connect, so `POST /auth/signout` also invalidates live sockets.

```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/notifications', {
  auth: { token: accessToken },   // or headers: { Authorization: `Bearer ${accessToken}` }
})
```

Handshake errors surface as a `connect_error` with
`"Unauthorized"` / `"Invalid token"`.

### Emit Events
```typescript
// Notifications namespace
socket.emit('user-online')                       // activity/presence

// LiveKit gateway — identity comes from the socket, not the payload
socket.emit('join-stream', { roomName, isHost: true })
socket.emit('leave-stream', { roomName })
```

### Listen for Events
```typescript
socket.on('notification', (n) => { /* this user's notifications only */ })
socket.on('stream-token', ({ token, roomName }) => { /* LiveKit access token */ })
socket.on('participant-joined', ({ userId }) => {})
socket.on('user-status-updated', (s) => {})
```

> Note: the emit/listen examples above reflect the gateways that are actually
> implemented. `message:send`, `post:like`, `message:received`, `user:typing`
> and `post:liked` are **not** currently emitted by any gateway.

---

## Testing API Endpoints

### Using cURL
```bash
# Get user
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users/me

# Create post
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world!"
  }'
```

### Using Postman
1. Set Authorization header: `Bearer <token>`
2. Set Content-Type: `application/json`
3. Copy-paste examples from above

### Using Thunder Client (VS Code)
Install the Thunder Client extension and import endpoints from examples above.

---

## Payments, Wallet & Payouts

Money moves only when `PAYMENTS_ENABLED=true` and `STRIPE_SECRET_KEY` is set.
Creator revenue uses a **90/10 split** (creator / platform) enforced in
`payments/revenue-split.ts` on every tip, subscription, and pay-per-view path.
Balances and history live in the append-only wallet ledger (`GET /wallet/ledger`).

### Wallet

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallet/balance` | JWT | Current `walletBalance` |
| GET | `/wallet/ledger?limit=` | JWT | Signed ledger entries (newest first) |

### Creator earnings & monetization

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/creator/earnings` | JWT | Ledger-derived earnings summary |
| GET | `/creator/dashboard` | JWT | Dashboard + `creatorSplit: 90` |
| GET | `/creator/tiers` | public | Default subscription tiers |
| POST | `/creator/tip` | JWT | Wallet tip `{ creatorId, amount, message? }` |
| POST | `/creator/subscribe` | JWT | Wallet subscription `{ creatorId, tierId }` |
| POST | `/creator/pay-per-view` | JWT | Wallet PPV purchase |

### Stripe Connect & payouts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/payments/connect/status` | JWT | Connect mode / `payoutsEnabled` |
| POST | `/payments/connect/onboard` | JWT | Express account onboarding link → `/earnings` |
| GET | `/payments/payouts` | JWT | Creator payout history |
| POST | `/payments/payouts/request` | JWT | Debit wallet → payout (`{ amount, purpose? }`) |
| POST | `/payments/payouts/schedule` | JWT | Debit now, release at `{ dueAt }` |
| GET | `/payments/admin/payouts/pending` | JWT+Admin | Manual queue |
| POST | `/payments/admin/payouts/:id/approve` | JWT+Admin | Mark paid + emit event |
| POST | `/payments/admin/payouts/:id/reject` | JWT+Admin | Refund wallet, mark rejected |

### Stripe webhook

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | Stripe signature | Raw body + `stripe-signature` header |

Handled event types (state-based idempotent — replay is a no-op):
- `payment_intent.succeeded` — credit recipient net + platform fee once
- `payment_intent.payment_failed` / `canceled` — never regress a succeeded txn
- `transfer.paid` / `transfer.failed` — finalize or reverse a payout
- `charge.refunded` — reverse recipient + platform credits once
- `account.updated` — sync Connect `payoutsEnabled`

Env: `STRIPE_WEBHOOK_SECRET` (required for signature verification),
`STRIPE_CONNECT_ENABLED` (optional; `false` forces the manual payout queue).

---

**For questions or issues, open a GitHub issue or check discussions.**
