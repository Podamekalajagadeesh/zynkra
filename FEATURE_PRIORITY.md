# Feature Priority Matrix: Zynkra

---

## How to Use This Document

Every feature in the codebase (and every feature proposed) is categorized into one of four tiers:

- **P0 (Must Have):** Ships with the MVP. If it's broken, the product doesn't work.
- **P1 (Important):** Ships within 3 months of launch. Increases retention and growth.
- **P2 (Future):** Ships within 6–12 months. Expands the platform's surface area.
- **P3 (Long-term Vision):** 12+ months out. Aspirational. Won't block anything.

**Decision rule:** When in doubt, push it down a tier. Less is more. Ship what proves the thesis; cut what doesn't.

---

## P0 — Must Have (MVP)

These features launch with the MVP. They are the minimum viable product.

### Core Identity & Auth
- [ ] Email + password sign up / login
- [ ] Email verification
- [ ] Forgot / reset password
- [ ] JWT session management
- [ ] User profiles (username, display name, bio, avatar)

### Content
- [ ] Create / edit / delete text posts (2,000 chars)
- [ ] Create / delete image posts (up to 4 images)
- [ ] Image upload and processing (resize, optimize)

### Social
- [ ] Follow / unfollow users
- [ ] Follower and following lists
- [ ] Chronological feed ("Following")
- [ ] Basic algorithmic feed ("For You" — recent + engagement)

### Engagement
- [ ] Like / unlike posts
- [ ] Like counts on posts
- [ ] Comment on posts
- [ ] Delete own comments

### Monetization
- [ ] Stripe Connect onboarding (creator connects bank)
- [ ] Subscription tiers (1–3 tiers, monthly pricing)
- [ ] One-time tips (preset amounts + custom)
- [ ] 90/10 revenue split enforcement
- [ ] Creator earnings dashboard
- [ ] Payout withdrawal to bank account
- [ ] Fan subscription management (subscribe, unsubscribe, view)

### Messaging
- [ ] 1:1 direct messages (text only)
- [ ] Real-time delivery via Socket.io
- [ ] Conversation list
- [ ] Unread count

### Notifications
- [ ] New follower notification
- [ ] New like on post notification
- [ ] New comment on post notification
- [ ] New DM received notification
- [ ] Notification bell with unread count
- [ ] Mark as read

### Discovery
- [ ] Search users by username
- [ ] User profile link from search results

### Creator Tools
- [ ] Creator onboarding wizard (profile → Stripe → tiers → first post)
- [ ] Subscriber count display
- [ ] Earnings dashboard (total, monthly, by tier)

### Infrastructure
- [ ] Post moderation (admin can delete any post)
- [ ] User reporting (flag content/users)
- [ ] Basic rate limiting
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline (lint, typecheck, build)

---

## P1 — Important (Post-MVP, 1–3 Months)

These features improve retention and growth after the MVP launches. They build on the P0 foundation.

### Content
- [ ] Bookmarks / save posts
- [ ] Post sharing (link copy, external share)
- [ ] Post editing (already created posts)
- [ ] Drafts (save incomplete posts)

### Social
- [ ] Comments with nested replies (threaded)
- [ ] Comment likes
- [ ] Block / unblock users
- [ ] Mute users (hide from feed without unfollowing)
- [ ] Follower recommendations ("People you may know")
- [ ] Follower/following search

### Monetization
- [ ] Pay-per-view content (single purchase, not subscription)
- [ ] Creator tiers program (badges, features, recognition)
- [ ] Subscriber-only posts (content visibility by tier)
- [ ] Fan subscription management dashboard (see what you pay for)
- [ ] Payment receipts (email)
- [ ] Subscription pause (freeze for 1–3 months)

### Messaging
- [ ] Image sharing in DMs
- [ ] Message reactions (emoji)
- [ ] Typing indicators
- [x] Read receipts (privacy-controlled DM receipts with client status updates)

### Notifications
- [ ] Email notifications (new follower, new tip, subscription renewal)
- [x] Notification preferences (toggle per event type)
- [x] Push notifications (web push via Service Worker)

### Content Moderation
- [ ] Automated spam detection
- [ ] NSFW content detection (NsfwJS)
- [ ] Content warning labels
- [ ] Community reporting workflow (admin dashboard)

### Analytics
- [ ] Creator post analytics (views, likes, engagement rate)
- [ ] Subscriber analytics (churn rate, growth rate)
- [ ] Revenue analytics (earnings over time, by tier)
- [ ] Platform-wide admin dashboard

### Growth
- [ ] OAuth sign-up (Google, Twitter)
- [ ] Invite codes / referrals
- [ ] Share to external platforms (Twitter, Instagram, etc.)
- [ ] Landing page optimization (A/B testing)

---

## P2 — Future (3–12 Months)

These features expand Zynkra's surface area. They grow the platform's reach and capability but are not needed to prove the core thesis.

### Content Formats
- [ ] Stories (24-hour ephemeral content)
- [ ] Short-form video (Reels/Shorts)
- [ ] Polls
- [ ] Long-form articles (rich text editor)
- [ ] Scheduled posts
- [ ] Threads (multi-post series)
- [ ] Podcast hosting

### Communities
- [ ] Groups (public/private, moderation tools)
- [ ] Events (create, RSVP, reminders)
- [ ] Fundraisers (crowdfunding for creators)
- [ ] DAO governance (proposals, voting, quorum)
- [ ] Community-led moderation (upvote/downvote flags)

### Commerce
- [ ] Marketplace (product listings, cart, checkout)
- [ ] Digital asset sales (digital downloads, courses)
- [ ] Live shopping (integrate with live streams)
- [ ] Escrow / buyer protection
- [ ] Product reviews

### Creator Monetization
- [ ] Sponsored content marketplace (brands ↔ creators)
- [ ] Affiliate program tracking
- [ ] Brand collaboration tools
- [ ] Multi-currency support
- [ ] Tax reporting (1099 forms for US creators)
- [ ] Revenue analytics (detailed breakdowns, export)

### Decentralization
- [ ] ActivityPub federation (outbound HTTP Signatures)
- [ ] Full data export (account, posts, followers)
- [ ] IPFS content storage
- [ ] Self-hosting guide

### Privacy & Security
- [ ] Two-factor authentication (TOTP)
- [ ] Passkeys / WebAuthn
- [ ] End-to-end encrypted DMs (Signal Protocol)
- [ ] Screenshot protection
- [ ] Session management (see active sessions, revoke)

### Discovery
- [ ] Trending topics
- [ ] Hashtag search and pages
- [ ] Explore page (personalized discovery)
- [ ] Full-text search (posts, users, hashtags)
- [ ] Snap Map (location-based content)

### AI & Translation
- [ ] Real-time translation (26 languages)
- [ ] Smart notification AI (priority filtering)
- [ ] AI content creation tools (generate, optimize, hashtags)
- [ ] AI moderation (spam, harassment, hate speech detection)

### Creator Tools
- [ ] Content scheduler
- [ ] Analytics dashboard (advanced)
- [ ] Subscriber CRM (view, manage, message subscribers)
- [ ] Email newsletter integration
- [ ] Course platform (lessons, quizzes, completion tracking)

---

## P3 — Long-term Vision (12+ Months)

These features represent the full Zynkra vision. They are aspirational goals that guide long-term architecture decisions.

### Web3
- [ ] Crypto wallet integration (WalletConnect)
- [ ] NFT minting and trading
- [ ] Token-gated content (multi-chain)
- [ ] SIWE (Sign-In with Ethereum)
- [ ] Blockchain identity / self-sovereign ID

### Video & Live
- [ ] Live streaming (via LiveKit)
- [ ] Live shopping events
- [ ] Video calling (1:1 and group)
- [ ] Screen sharing
- [ ] Spatial audio

### Mobile
- [ ] Native iOS app
- [ ] Native Android app
- [ ] Offline-first architecture (IndexedDB + Service Worker + Background Sync)
- [ ] Offline queue with conflict resolution

### AI
- [ ] On-device LLM (WebLLM — runs 100% in browser)
- [ ] AI chatbot (community FAQ)
- [ ] AI copilot (content suggestions)
- [ ] Sentiment analysis on posts
- [ ] Content moderation (ML-powered)

### Advanced Monetization
- [ ] Token-gated tiers (crypto-only subscriptions)
- [ ] Tipping via crypto (USDC, ETH)
- [ ] DAO treasury management
- [ ] Yield on creator earnings

### Platform
- [x] Multiple accounts (switch between creator/personal)
- [ ] API access (public API for creators/devs)
- [ ] Webhook system (custom integrations)
- [ ] White-label solutions (creator's own domain)

---

## Priority Summary

| Tier | Count | Timeframe | Theme |
|------|-------|-----------|-------|
| **P0** | ~40 features | MVP launch | **"Prove the payout loop"** |
| **P1** | ~35 features | 1–3 months post-launch | **"Improve retention & growth"** |
| **P2** | ~55 features | 3–12 months post-launch | **"Expand the platform"** |
| **P3** | ~25 features | 12+ months | **"Full vision"** |

---

## Feature Deprecation Policy

As the platform grows, some features will be:
1. **Matured** — P2/P3 features that proved their value and are promoted to P1
2. **Suspended** — P2/P3 features that aren't resonating, paused for 6 months
3. **Removed** — Features that actively harm the product or are never used

Every quarter, review feature usage:
- If < 1% of users interact with a P2/P3 feature → deprecate
- If < 5% of creators use a P1 feature → re-evaluate priority
- If a P0 feature has < 50% adoption → fix the UX, don't remove it

---

*This document is the source of truth for product priorities. When new features are proposed, they go here first. If a feature isn't in this list, it doesn't exist in the product until it's added.*
