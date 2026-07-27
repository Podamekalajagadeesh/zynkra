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

server/              # NestJS backend (65+ modules)
├── src/
│   ├── users/       # User management
│   ├── posts/       # Post creation & engagement
│   ├── feed/        # Feed algorithms
│   ├── dms/         # Direct messaging
│   ├── payments/    # Monetization & creator payouts
│   ├── marketplace/ # Commerce features
│   └── [55+ more feature modules]
└── package.json
```

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
✅ DMs with Signal Protocol key infrastructure (encrypted in transit; full E2EE in progress)
✅ ActivityPub federation (inbound + outbound with HTTP Signatures)
✅ Creator monetization (Stripe Connect payouts, 90/10 revenue split)
✅ Real-time messaging with Socket.IO
✅ Marketplace with listings, cart, orders
✅ Long-form articles, podcast hosting, course platform, newsletter system
✅ Community-led moderation (spam, harassment, hate speech detection via NSFWJS)
✅ Data export & portability
✅ Web3 (crypto wallet, WalletConnect, NFTs, token-gated content)
✅ AI chatbot (FAQ-based); on-device LLM is **Preview** (requires `@mlc-ai/web-llm`)
✅ Offline-first (IndexedDB queue + Service Worker)

## Development Status
See [ROADMAP.md](ROADMAP.md) for the full phased plan and honest baseline assessment.

### ✅ Working (Core loop)
- [x] Authentication (JWT, OAuth, Passkeys, 2FA, SIWE)
- [x] User profiles, follows, blocking
- [x] Posts, comments, reactions, bookmarks
- [x] Feed algorithms (For You, Following, Chronological, Trending)
- [x] DMs (encrypted in transit via TLS; Signal Protocol key exchange)
- [x] Groups, events, fundraisers
- [x] Media uploads
- [x] Notifications
- [x] Search, hashtags, trends
- [x] Admin dashboard, moderation

### 🔄 Working (Differentiators)
- [x] Creator payouts (Stripe Connect, wallet ledger)
- [x] ActivityPub federation (HTTP Signatures, WebFinger, NodeInfo)
- [x] Offline sync queue
- [x] AI chatbot (Preview)
- [x] Real-time translation (26 languages)

### 🔄 Preview (visible but shallow)
- Stories, Reels, Marketplace, Dating, DAO governance, Courses, Newsletters, Podcasts

### ❌ Not started
- Mobile apps (iOS/Android native)
- On-device LLM (requires `@mlc-ai/web-llm` dependency)
- Full end-to-end encryption (server-side enforcement)

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
