# MVP Definition: Zynkra

---

## MVP Principle

> **The MVP is the tightest possible loop that proves the core thesis: creators earn more on Zynkra.**

Everything in the MVP exists to answer one question: "Will a creator join, monetize, and stay?"

Everything outside the MVP is noise until we prove that loop works.

---

## MVP Scope: "Creator Payout Loop"

### The One Screen That Matters
A creator signs up → connects Stripe → posts content → earns money → sees it in their dashboard → withdraws to their bank.

That's the MVP. Everything else supports or simplifies this loop.

---

## MVP Features (Launch-Required)

### 1. Authentication
**What:** Sign up, log in, forgot password, email verification
**Why:** Foundation of everything. Cannot skip.
**Scope:**
- Email + password registration
- Login/logout
- Forgot password / reset
- Email verification
- JWT-based session

**NOT in MVP:** OAuth (Google, Twitter), Passkeys, 2FA, SIWE, multi-account switching

---

### 2. User Profiles
**What:** Basic profile with avatar, bio, username
**Why:** Creators need an identity. Fans need to know who they're following.
**Scope:**
- Username, display name, bio, avatar
- Profile page showing posts
- Edit profile

**NOT in MVP:** Verification badges, cover photos, profile themes, linked accounts

---

### 3. Posts (Core Content)
**What:** Create, view, edit, delete text/image posts
**Why:** Content is what creators make and fans consume. This is the engine.
**Scope:**
- Text posts (up to 2,000 characters)
- Image uploads (up to 4 images per post)
- Post editing and deletion
- Feed of posts from followed users
- Public profile feed

**NOT in MVP:** Video posts, stories, reels, polls, threads, scheduled posts, long-form articles

---

### 4. Follow System
**What:** Follow/unfollow creators, see follower/following counts
**Why:** Audience building is the prerequisite for monetization.
**Scope:**
- Follow/unfollow users
- Follower and following lists
- Follower counts on profiles

**NOT in MVP:** Follow requests (private accounts), follower recommendations, mutual follows

---

### 5. Feed
**What:** Chronological feed of posts from followed creators
**Why:** Fans need to see content. This is how creators reach their audience.
**Scope:**
- "Following" feed — chronological, posts from people you follow
- "For You" feed — basic algorithmic (recent posts + engagement signals)
- Pull-to-refresh, infinite scroll

**NOT in MVP:** 6 feed algorithms, user-controlled feed selection, trending feed

---

### 6. Likes / Reactions
**What:** Like posts, see like counts
**Why:** Minimum viable engagement signal. Social proof drives behavior.
**Scope:**
- Like/unlike posts
- Like count on posts
- "Liked by" list

**NOT in MVP:** Multiple reaction types (love, haha, etc.), reactions on comments

---

### 7. Comments
**What:** Comment on posts, view comments
**Why:** Community engagement. Fans talk to creators; creators talk to fans.
**Scope:**
- Add comments on posts
- View comments
- Delete own comments
- Comment count on posts

**NOT in MVP:** Nested replies (threaded comments), comment likes, comment moderation tools

---

### 8. Direct Messages (Basic)
**What:** 1:1 text messaging between users
**Why:** Creators need to talk to fans. Especially for paid/premium content access.
**Scope:**
- Send/receive text messages
- Conversation list
- Real-time delivery via Socket.io
- Read receipts

**NOT in MVP:** Group DMs, media sharing in DMs, E2EE, message reactions, message search

---

### 9. Notifications
**What:** In-app notifications for key actions
**Why:** Creators need to know when fans engage. Fans need to know when creators post.
**Scope:**
- New follower
- New like on post
- New comment on post
- New DM received
- Notification bell with unread count
- Mark as read

**NOT in MVP:** Push notifications, email notifications, notification preferences, smart notification AI

---

### 10. Search
**What:** Find users by username or display name
**Why:** Discovery. Fans need to find creators. Creators need to be findable.
**Scope:**
- Search users by username
- Search results with profile preview
- User profile link from results

**NOT in MVP:** Full-text search, hashtag search, trending topics, advanced filters

---

### 11. Creator Monetization (The Core)
**What:** Creators earn money directly from fans
**Why:** **This is the entire point of Zynkra.** Without this, we're just another social network.
**Scope:**
- **Stripe Connect onboarding** — creator connects their Stripe account in < 5 minutes
- **Subscription tiers** — creator sets up 1–3 subscription tiers with monthly pricing
- **One-time tips** — fans can send a tip of any amount ($1 minimum)
- **Creator earnings dashboard** — see total earnings, subscriber count, recent transactions
- **90/10 revenue split** — platform takes 10%, creator keeps 90%
- **Payout withdrawal** — creator can withdraw earnings to their bank account
- **Subscription management** — fans can subscribe, unsubscribe, view their subscriptions

**NOT in MVP:** Pay-per-view content, sponsored content marketplace, brand collaboration tools, affiliate programs, crypto payouts, creator tiers program

---

### 12. Creator Onboarding Wizard
**What:** Guided flow for new creators to set up monetization
**Why:** If setup takes more than 5 minutes, creators abandon it. This is the critical conversion point.
**Scope:**
- Step 1: Set display name and bio
- Step 2: Connect Stripe account (Stripe Connect hosted onboarding)
- Step 3: Create first subscription tier (name, price, description)
- Step 4: Create first post
- Progress indicator showing setup completeness

**NOT in MVP:** Multi-step analytics tour, content calendar setup, brand kit configuration

---

## MVP User Flows

### Flow 1: Creator Onboarding
```
Sign up → Email verify → Onboarding wizard →
  Set profile → Connect Stripe → Create subscription tier → Create first post →
  Dashboard shows: "Ready to earn!"
```

### Flow 2: Fan Discovery to Payment
```
Discover creator (search/follow) → View profile → See subscription tiers →
  Subscribe ($5/mo) OR Tip ($5) → Confirmation →
  See exclusive content in feed
```

### Flow 3: Creator Earning
```
Post content → Fan sees in feed → Fan likes/tips →
  Creator gets notification → Creator sees earnings dashboard →
  Earnings accumulate → Creator withdraws to bank
```

---

## MVP Out of Scope (Post-Launch)

These features are explicitly **NOT** in the MVP. They will be built after we validate the core creator payout loop.

### Social Features (P1)
- Stories
- Reels / short-form video
- Polls
- Bookmarks / save
- Hashtags and trending topics
- Comments with nested replies

### Content Formats (P1)
- Long-form articles
- Podcast hosting
- Video posts
- Scheduled posts

### Community (P2)
- Groups
- Events
- Community moderation tools

### Commerce (P2)
- Marketplace (product listings, cart, orders)
- Live shopping
- Digital asset sales

### Decentralization (P2)
- ActivityPub federation
- Data export
- IPFS content storage

### Web3 (P2)
- Crypto wallet integration
- NFTs
- Token-gated content
- DAO governance
- SIWE (Sign-In with Ethereum)

### Advanced (P3)
- AI content tools
- Real-time translation
- On-device LLM
- Mobile apps
- Offline-first architecture

---

## MVP Success Criteria

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Creator signups | 500 | First 30 days |
| Stripe Connect completion rate | 60% of signups | First 30 days |
| First post created | 80% of Stripe-connected creators | First 7 days after setup |
| First dollar earned | 30% of Stripe-connected creators | First 30 days after setup |
| Fan subscriptions | 200 total | First 30 days |
| Creator retention (30-day) | 70% | 30 days post-signup |
| Time to first dollar (median) | < 7 days | Ongoing |

---

## MVP Technology Choices

These are product decisions, not implementation details:

| Choice | Decision | Why |
|--------|----------|-----|
| Platform | Web (responsive) | Fastest to market, reach widest audience |
| Auth | Email + password only | Lowest friction for MVP; OAuth comes later |
| Payments | Stripe Connect | Industry standard, handles global payouts, 10% split is clean |
| Content | Text + images only | Lowest production burden; video/articles come later |
| Messaging | Real-time text DMs | Essential for creator-fan relationship |
| Feed | Chronological + basic algorithmic | Simple, predictable, doesn't require ML infrastructure |
| Moderation | Manual flagging + review | Enough for MVP scale; automated tools come later |

---

## What "Done" Looks Like

The MVP is done when:

1. A creator can sign up, connect Stripe, create subscription tiers, and post content in under 10 minutes
2. A fan can discover a creator, subscribe or tip, and see content in their feed
3. Creator earnings are correctly tracked, displayed, and withdrawable
4. The payments path has zero critical bugs and 99.5%+ uptime
5. 500 creators have signed up, 300 have connected Stripe, and 150 have earned at least $1

**Everything else can wait.**

---

*This document defines the MVP boundary. If a feature isn't listed here, it's not in the MVP. When in doubt, ship less. The goal is to prove the creator payout loop works — not to build the full platform.*
