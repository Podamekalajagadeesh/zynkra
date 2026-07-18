# DEVELOPMENT.md
**Local Development Setup & Running Guide**

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Setup](#environment-setup)
4. [Running Locally](#running-locally)
5. [Development Workflow](#development-workflow)
6. [Debugging](#debugging)
7. [Common Issues](#common-issues)

---

## Prerequisites

### Required
- **Node.js** 18.0.0+ ([download](https://nodejs.org/))
- **npm** 9.0.0+ (comes with Node.js)
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/))
- **Git** ([download](https://git-scm.com/))

### Optional (but recommended)
- **Docker** - for running PostgreSQL in container
- **VS Code** - recommended IDE
- **Postman** - for testing API endpoints
- **pgAdmin** - for database management

### Verify Installation
```bash
node --version    # Should be 18+
npm --version     # Should be 9+
psql --version    # Should be 14+
git --version     # Any recent version
```

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/Podamekalajagadeesh/zynkra.git
cd zynkra
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)
```bash
# From project root
docker run --name zynkra-db \
  -e POSTGRES_USER=zynkra \
  -e POSTGRES_PASSWORD=zynkra123 \
  -e POSTGRES_DB=zynkra_dev \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps | grep zynkra-db
```

#### Option B: Local PostgreSQL Installation
```bash
# macOS (via Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Run the PostgreSQL installer from postgresql.org

# Create database
psql -U postgres
CREATE DATABASE zynkra_dev;
CREATE USER zynkra WITH PASSWORD 'zynkra123';
GRANT ALL PRIVILEGES ON DATABASE zynkra_dev TO zynkra;
\q
```

### 5. Verify Database Connection
```bash
psql -h localhost -U zynkra -d zynkra_dev -c "SELECT 1;"
# Should output: ?column?
#        1
```

---

## Environment Setup

### Backend (.env)
Create `server/.env`:
```env
# Database
DATABASE_URL=postgresql://zynkra:zynkra123@localhost:5432/zynkra_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# Environment
NODE_ENV=development
PORT=3000

# External Services (optional for development)
STRIPE_SECRET_KEY=sk_test_xxx
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# IPFS (optional)
IPFS_GATEWAY_URL=https://gateway.pinata.cloud

# ActivityPub
AP_DOMAIN=http://localhost:3000
AP_SIGNATURE_KEY_ID=http://localhost:3000/users/zynkra#main-key
```

### Frontend (.env.local)
Create `client/.env.local`:
```env
# API
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Features
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_E2EE=true
VITE_ENVIRONMENT=development
```

---

## Running Locally

### Database Migrations
```bash
cd server

# Run migrations
npm run typeorm migration:run

# Or if using TypeORM CLI:
npx typeorm migration:run -d dist/database.js
```

### Terminal 1: Backend
```bash
cd server
npm run dev
# Should output: 
# Listening on port 3000
# Database: zynkra_dev connected
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
# Should output:
# Local:   http://localhost:5173/
# Press 'q' to quit
```

### Terminal 3: (Optional) Database Monitor
```bash
docker exec -it zynkra-db psql -U zynkra -d zynkra_dev

# Or if using local PostgreSQL:
psql -h localhost -U zynkra -d zynkra_dev
```

### Testing & QA
```bash
cd server
npm run test:unit
npm run test:qa
npm run test:coverage
npm run qa:check

cd ../client
npm run smoke:offline
npm run test
npm run build

cd ../mobile
npm run beta:internal
```

These commands run the real backend unit, integration, and smoke tests plus the security audit script so release readiness is measured from the repository rather than assumed. The client offline smoke check and the mobile internal beta build manifest now provide concrete validation artifacts for Week 4 release work.

### Access the App
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **GraphQL** (if enabled): http://localhost:3000/graphql

---

## Development Workflow

### Adding a New Feature

#### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### 2. Backend Development
```bash
# Create a new module
cd server/src
nest g module features/your-feature

# Create controller & service
nest g controller features/your-feature
nest g service features/your-feature

# Create database entity
touch src/features/your-feature/your-feature.entity.ts

# Create migration
npm run typeorm migration:create -- -n AddYourFeature
```

#### 3. Frontend Development
```bash
# Create component
mkdir -p client/src/components/YourFeature
touch client/src/components/YourFeature/YourFeature.tsx
touch client/src/components/YourFeature/YourFeature.module.css

# Create page
mkdir -p client/src/pages/YourFeature
touch client/src/pages/YourFeature.tsx

# Create service
touch client/src/services/yourFeature.service.ts
```

#### 4. Testing
```bash
# Backend tests
cd server
npm run test

# Frontend tests
cd ../client
npm run test
```

#### 5. Git Commit
```bash
git add .
git commit -m "feat: add your feature name

- Brief description of changes
- Any breaking changes
- Closes #123"

git push origin feature/your-feature-name
```

---

## Debugging

### Backend Debugging

#### VS Code Debugger
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "NestJS Backend",
      "program": "${workspaceFolder}/server/node_modules/.bin/nest",
      "args": ["start", "--debug"],
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

Press F5 to start debugging. Set breakpoints by clicking on line numbers.

#### Logging
```typescript
// In any service or controller
import { Logger } from '@nestjs/common';

export class YourService {
  private logger = new Logger(YourService.name);

  someMethod() {
    this.logger.log('This is a log message');
    this.logger.debug('Debug info');
    this.logger.warn('Warning message');
    this.logger.error('Error message');
  }
}
```

### Frontend Debugging

#### React DevTools Browser Extension
1. Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
2. Open DevTools (F12)
3. Components tab shows React component tree
4. Profiler tab shows performance metrics

#### Console Logging
```typescript
console.log('Variable:', myVar);
console.table([{ id: 1, name: 'Test' }]);
console.trace('Stack trace');
```

#### Network Inspection
1. Open DevTools (F12)
2. Network tab
3. Perform action to see API calls
4. Click request to see headers, body, response

### Database Debugging

#### Query Logging
Enable query logging in `server/.env`:
```env
DB_LOGGING=true
```

View logs in terminal where backend is running.

#### pgAdmin UI (Optional)
```bash
docker run --name pgadmin \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -p 5050:80 \
  -d dpage/pgadmin4
```
Access at http://localhost:5050

---

## Common Issues

### Issue: "Cannot find module" errors after installation
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection refused
**Solution**: Verify PostgreSQL is running
```bash
# Docker
docker ps | grep zynkra-db

# Local PostgreSQL
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### Issue: Port 3000 already in use
**Solution**: Change port in `.env` or kill existing process
```bash
# Find what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in server/.env
PORT=3001
```

### Issue: Port 5173 already in use
**Solution**: Vite will auto-increment, or change in `client/vite.config.ts`
```typescript
export default defineConfig({
  server: {
    port: 5174
  }
})
```

### Issue: "EACCES: permission denied" on macOS/Linux
**Solution**: Check npm permissions
```bash
npm config get prefix
# Should be ~/.npm-global or /usr/local

# Fix ownership
sudo chown -R $(whoami) ~/.npm-global
```

### Issue: React component not updating
**Solution**: Check for:
1. Missing `useCallback` or `useMemo` dependencies
2. State mutation (don't mutate state directly)
3. Missing key props in lists
4. Component in strict mode (expected double-render)

### Issue: TypeScript errors but code runs
**Solution**: Run type check
```bash
# Backend
cd server
npm run build

# Frontend
cd ../client
npm run type-check
```

### Issue: Database migrations failed
**Solution**: Rollback and redo
```bash
cd server

# Revert last migration
npm run typeorm migration:revert

# Check migration status
npm run typeorm migration:show

# Re-run migrations
npm run typeorm migration:run
```

---

## Performance Tips

### Frontend
- Use React.memo for expensive components
- Use useMemo for expensive computations
- Lazy-load routes with React.lazy
- Check bundle size: `npm run build && npm run analyze`
- Use Chrome DevTools Lighthouse for metrics

### Backend
- Enable query caching in Redis
- Use database indexes for frequently queried columns
- Monitor slow queries: `npm run typeorm query:show`
- Use pagination for large datasets

### Database
```sql
-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
```

---

## Useful Commands

### Backend
```bash
cd server

npm run dev              # Start dev server
npm run build          # Build for production
npm run test           # Run tests
npm run test:watch    # Run tests in watch mode
npm run lint          # Lint code
npm run format        # Format code with Prettier
npm run typeorm       # TypeORM CLI
```

### Frontend
```bash
cd client

npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run test            # Run tests
npm run type-check      # Check TypeScript
npm run lint            # Lint code
```

---

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) for code guidelines
3. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for backend endpoints
4. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for what to work on

---

**Questions?** Open an issue on GitHub or check discussions.
