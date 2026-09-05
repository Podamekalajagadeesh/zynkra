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
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

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
  "content": "Hi there! 👋",
  "isEncrypted": true
}
```

**Response (201)**:
```json
{
  "id": "message-001",
  "senderId": "user-123",
  "recipientId": "user-456",
  "content": "encrypted_content_here",
  "isEncrypted": true,
  "isRead": false,
  "createdAt": "2024-07-04T12:00:00Z"
}
```

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

API calls are rate-limited to prevent abuse:

```
- 100 requests per minute per user
- 10 requests per second per user
```

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625404800
```

If exceeded:
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate limit exceeded. Try again after 60 seconds"
}
```

---

## WebSocket Events (Real-Time)

Connect to WebSocket at `ws://localhost:3000`:

### Emit Events
```typescript
// Send message in real-time
socket.emit('message:send', {
  recipientId: 'user-456',
  content: 'Hello!'
})

// Like a post
socket.emit('post:like', {
  postId: 'post-789'
})
```

### Listen for Events
```typescript
// Receive new message
socket.on('message:received', (data) => {
  console.log(data)
})

// See when user is typing
socket.on('user:typing', (data) => {
  console.log(`${data.username} is typing...`)
})

// Get real-time post likes
socket.on('post:liked', (data) => {
  console.log(`${data.user.username} liked your post`)
})
```

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

**For questions or issues, open a GitHub issue or check discussions.**
