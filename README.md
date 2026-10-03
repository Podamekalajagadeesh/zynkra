# Zynkra — Universal Social Media
**Universal social media platform.**

## Quick Links
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup & running locally
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & tech stack
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Backend API reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines

## Project Structure
```
client/              # React + Vite frontend
├── src/
│   ├── components/  # Reusable React components
│   ├── pages/       # Full-page features
│   ├── services/    # API clients & business logic
│   ├── contexts/    # React state management
│   └── hooks/       # Custom React hooks
└── package.json

server/              # NestJS backend (105 feature dirs; ~20 load-bearing)
├── src/
│   ├── users/       # User management
│   ├── posts/       # Post creation & engagement
│   ├── feed/        # Feed algorithms
│   ├── dms/         # Direct messaging (1:1 is E2EE)
│   ├── payments/    # Monetization & creator payouts
│   ├── wallet/      # Ledger & balances
│   ├── federation/  # ActivityPub
│   └── features/    # 64 stub dirs — facade, NOT wired into app.module.ts
└── package.json
```

The directory count is large but most of it is not shipped. Of the 105 feature directories,
**~20 are load-bearing**, ~12 are labeled Preview, and 64 under `server/src/features/` are
`console.log` stubs that are never registered — they are not reachable at all, not even as a
404. See [ROADMAP.md](ROADMAP.md) §1.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, PostgreSQL
- **Real-time**: Socket.io, LiveKit
- **Infrastructure**: IPFS, ActivityPub federation, Blockchain
- **Dev Tools**: ESLint, Prettier, Jest, Vitest

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation
```bash
# Clone repo
git clone https://github.com/Podamekalajagadeesh/zynkra.git
cd zynkra

# Install dependencies
cd client && npm install
cd ../server && npm install

# See DEVELOPMENT.md for full setup
```

### Running Locally
```bash
# Terminal 1: Backend (NestJS)
cd server
npm run dev

# Terminal 2: Frontend (React)
cd client
npm run dev

# App runs at http://localhost:5173
# API at http://localhost:3000
```

## Key Features
✅ Core social (posts, comments, reactions, stories, reels, polls, bookmarks)
✅ User auth (JWT, OAuth, Passkeys, 2FA, Sign-In with Ethereum)
✅ DMs with Signal Protocol key infrastructure — 1:1 conversations are E2EE (ciphertext-only at rest); group/media/modmail are not
✅ ActivityPub federation (inbound discovery + outbound delivery with HTTP Signatures when `FEDERATION_ENABLED=true`)
✅ Creator monetization (Stripe Connect payouts, 90/10 revenue split)
✅ Real-time messaging with Socket.IO
✅ Marketplace with listings, cart, orders
✅ Long-form articles, podcast hosting, course platform, newsletter system
✅ Community-led moderation (spam, harassment, hate speech detection via NSFWJS)
✅ Data export & portability
✅ Web3 (crypto wallet, WalletConnect, NFTs, token-gated content)
✅ AI chatbot (FAQ-based via OpenRouter cloud API); on-device LLM panel is **Preview** (requires `@mlc-ai/web-llm` + WebGPU)
✅ Offline-first (IndexedDB queue + Service Worker)

## Development Status
See [ROADMAP.md](ROADMAP.md) for the full phased plan and honest baseline assessment.

### ✅ Working (Core loop)
- [x] Authentication (JWT, OAuth, Passkeys, 2FA, SIWE)
- [x] User profiles, follows, blocking
- [x] Posts, comments, reactions, bookmarks
- [x] Feed algorithms (For You, Following, Chronological, Trending)
- [x] DMs — 1:1 conversations are E2EE: the browser Signal client encrypts before upload, and the server stores only the ciphertext envelope (it rejects readable plaintext once both parties have published identity keys). Group, page, and modmail conversations are **not** E2EE. See ROADMAP.md Phase 3.
- [x] Groups, events, fundraisers
- [x] Media uploads (local disk + optional CDN; sharp image processing; avatars/stories/posts wired)
- [x] Notifications
- [x] Search, hashtags, trends
- [x] Admin dashboard, moderation

### 🔄 Working (Differentiators)
- [x] Creator payouts (Stripe Connect, wallet ledger)
- [x] ActivityPub federation — outbound HTTP Signatures **and inbound verification** (unsigned or forged activities are rejected), persisted inbound follows, post fan-out on create, retraction on delete, cross-instance boosts, a readable federated timeline at `GET /federation/timeline`, WebFinger, NodeInfo. Requires `FEDERATION_ENABLED=true`; interop test vs Mastodon still pending
- [x] Offline sync queue
- [x] AI chatbot (Preview)
- [x] Real-time translation (26 languages)

### 🔄 Preview (visible but shallow)
- Stories, Reels, Marketplace, Dating, Courses, Newsletters, Podcasts

### ❌ Not started
- Mobile apps (iOS/Android native)
- Per-recipient media encryption in DMs (attachments are stored server-side and served to
  anyone with the URL)
- E2EE beyond 1:1 text: group/page/modmail conversations, key rotation, multi-device
  recovery, and retro-encrypting pre-existing plaintext threads

> **Not implemented:** DAO governance, token-gated content, an in-app token system, and
> blockchain identity were cut from the product surface — they were facade, not features.
> `$ZYNK` was a Postgres row, snapmap locations lived in in-process `Map`s. See
> [ROADMAP.md](ROADMAP.md) §6 for why, and §1 for what replaced them (SIWE wallet-sign auth
> covers the useful part of "blockchain identity").

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Branch strategy
- Commit conventions
- Code style guidelines
- PR process
- Testing requirements

## Documentation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup, debugging, troubleshooting
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design, module structure
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Backend API endpoints

## License
MIT

## Support
- GitHub Issues: [Report bugs](https://github.com/Podamekalajagadeesh/zynkra/issues)
- Discussions: [Ask questions](https://github.com/Podamekalajagadeesh/zynkra/discussions)
