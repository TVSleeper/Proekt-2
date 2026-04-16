# Quick Start Guide - Proekt-2

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Docker (optional, for containerized deployment)

## Installation

### 1. Install Dependencies

```bash
cd Proekt-2
npm run install:all
```

This will install dependencies for:
- Root project
- Frontend (Next.js)
- Backend (Express.js)

### 2. Environment Setup

Create `.env.local` files in both frontend and backend directories:

**frontend/.env.local**
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**backend/.env**
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=liquidity_manager
REDIS_URL=redis://localhost:6379
```

## Development

### Start Development Servers

```bash
npm run dev
```

This starts both frontend and backend in development mode:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Dashboard: http://localhost:3000/dashboard

### Individual Server Startup

**Frontend only:**
```bash
npm run dev:frontend
```

**Backend only:**
```bash
npm run dev:backend
```

## Building

### Build for Production

```bash
npm run build
```

Builds both frontend and backend for production.

### Build Frontend Only

```bash
cd frontend && npm run build
```

### Build Backend Only

```bash
cd backend && npm run build
```

## Running Production Build

```bash
npm start
```

Starts the production backend server on port 3001.

## Testing

### Run All Tests

```bash
npm run test
```

### Backend Tests

```bash
cd backend && npm test
```

### Backend Tests with Coverage

```bash
cd backend && npm test -- --coverage
```

### Watch Mode (Development)

```bash
cd backend && npm test -- --watch
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up
```

This starts:
- Frontend (Next.js) on port 3000
- Backend (Express.js) on port 3001
- PostgreSQL database on port 5432
- Redis on port 6379

### Stop Docker Services

```bash
docker-compose down
```

## Project Structure

```
Proekt-2/
├── frontend/              # Next.js React application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── styles/       # Global styles
│   └── package.json
├── backend/              # Express.js TypeScript server
│   ├── src/
│   │   ├── agents/       # AI agent implementations
│   │   ├── memory/       # Memory systems
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route handlers
│   │   └── config/       # Configuration
│   ├── tests/            # Test suites
│   └── package.json
├── contracts/            # Smart contracts
├── docs/                 # Documentation
└── package.json         # Root workspace config
```

## Key Features

### Frontend
- Real-time AI Agent Dashboard
- Liquidity Manager Interface
- Wallet Connect Integration
- Responsive Design (Tailwind CSS)
- Dark Theme

### Backend
- Multi-Agent System with ReAct Loop
- Message Queue (Redis)
- Memory Systems (Working, Episodic, Semantic)
- RESTful API
- PostgreSQL Database

### Agents
- Team Lead Agent
- Frontend Developer Agent
- Backend Developer Agent
- Coordination System

## API Endpoints

### Dashboard
- `GET /api/dashboard/agents` - List all agents
- `GET /api/dashboard/agents/:id` - Get specific agent
- `GET /api/dashboard/metrics` - Get system metrics
- `GET /api/dashboard/logs` - Get system logs
- `GET /api/dashboard/communication` - Get communication stats
- `GET /api/dashboard/tasks` - Get all tasks
- `GET /api/dashboard/health` - Get system health

### Pools
- `GET /api/pools` - List all pools
- `GET /api/pools/:poolAddress` - Get pool details
- `GET /api/pools/by-token/:tokenAddress` - Get pools by token

### Tokens
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/:address` - Get token details

### Positions
- `GET /api/positions` - List all positions
- `GET /api/positions/:id` - Get position details

### Transactions
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get transaction details

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues

Ensure PostgreSQL is running:

```bash
# macOS with Homebrew
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### Redis Connection Issues

Ensure Redis is running:

```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:7
```

### Dependencies Not Installing

Clear cache and reinstall:

```bash
rm -rf node_modules frontend/node_modules backend/node_modules
npm cache clean --force
npm run install:all
```

## Code Quality

### Type Checking

```bash
cd frontend && npm run type-check
cd backend && npm run type-check
```

### Linting

```bash
cd frontend && npm run lint
cd backend && npm run lint
```

### Formatting

```bash
cd frontend && npx prettier --write "src/**/*.{ts,tsx}"
cd backend && npx prettier --write "src/**/*.ts"
```

## Useful Commands

### View Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend build output
npm run build:frontend
```

### Database Management

```bash
# Connect to PostgreSQL
psql -U postgres -d liquidity_manager

# View Redis data
redis-cli
```

### Git Operations

```bash
# Check status
git status

# View changes
git diff

# Commit changes
git add .
git commit -m "Your message"

# Push to remote
git push origin main
```

## Performance Tips

1. **Frontend**: Use Next.js Image component for images
2. **Backend**: Enable query caching with Redis
3. **Database**: Add indexes on frequently queried columns
4. **Memory**: Monitor agent memory usage with dashboard

## Security

- Never commit `.env` files
- Use environment variables for sensitive data
- Keep dependencies updated: `npm audit fix`
- Review security warnings: `npm audit`

## Support & Documentation

- Frontend docs: See `frontend/README.md`
- Backend docs: See `backend/README.md`
- API docs: See `docs/API.md`
- Architecture: See `docs/ARCHITECTURE.md`

## Next Steps

1. Start development: `npm run dev`
2. Open http://localhost:3000 in browser
3. View dashboard at http://localhost:3000/dashboard
4. Check API at http://localhost:3001/health
5. Review documentation in `docs/` folder

---

**Last Updated**: 2026-04-16
**Status**: ✅ Ready for Development