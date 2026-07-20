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
✅ End-to-end encryption (all DMs, messages, content)
✅ Offline-first architecture (works without internet)
✅ ActivityPub federation (connects with Mastodon, Pixelfed, etc.)
✅ 90/10 creator revenue split
✅ Community-led moderation (no corporate control)
✅ Full data export & portability
✅ Local-first AI (Llama 3 on-device)
✅ Decentralized identity (blockchain-based)

## Development Status
- [x] Core social features (posts, comments, reactions)
- [x] Direct messaging with E2EE
- [x] Content creation & editing
- [x] User profiles & follows
- [x] Feed algorithm
- [ ] Mobile apps (iOS/Android native)
- [ ] Offline-first sync engine
- [ ] Full ActivityPub interop
- [ ] Creator payouts system

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
