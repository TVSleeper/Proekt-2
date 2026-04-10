# Liquidity Manager - Master Development Plan

> **How to use this document:** Start each AI agent session by reading this file. Check current status, find the next task to execute, and update the status upon completion. Each task is self-contained with clear instructions.

---

## Project Status Overview

**Last Updated:** 2026-04-10  
**Current Phase:** 🔴 NOT STARTED  
**Overall Progress:** 0% (0/120 tasks)  
**Current Sprint:** Phase 1 - Foundation & Infrastructure  

### Progress Summary

| Phase | Status | Progress | Tasks | Next Action |
|-------|--------|----------|-------|-------------|
| **Phase 1**: Foundation & Infrastructure | 🔴 TODO | 0/15 | Infrastructure setup, database, dev environment | Start Task 1.1 |
| **Phase 2**: Backend Core API | 🔴 TODO | 0/22 | All backend services and endpoints | Depends on Phase 1 |
| **Phase 3**: Frontend UI & Components | 🔴 TODO | 0/30 | All user interface components | Depends on Phase 1 |
| **Phase 4**: Web3 Integration | 🔴 TODO | 0/18 | Blockchain transactions, contracts | Depends on Phase 2, 3 |
| **Phase 5**: Advanced Features | 🔴 TODO | 0/15 | Analytics, charts, optimization | Depends on Phase 4 |
| **Phase 6**: Testing & QA | 🔴 TODO | 0/12 | Tests, bug fixes, security | Depends on all phases |
| **Phase 7**: Deployment | 🔴 TODO | 0/8 | Production deployment | Depends on Phase 6 |

---

## How AI Agents Should Use This Document

### Starting a New Session

1. **Read this document** from the top
2. **Find the first task** marked as 🔴 TODO with highest priority
3. **Read the task details** completely
4. **Execute the task** following all specifications
5. **Update this document**: Change status from 🔴 TODO to 🟢 DONE
6. **Report what was completed** to the user

### Task Status Legend

| Symbol | Meaning | Action |
|--------|---------|--------|
| 🔴 TODO | Not started | **Start working on this** |
| 🟡 IN PROGRESS | Being worked on | Continue or help |
| 🟢 DONE | Completed successfully | Skip, move to next |
| ⚠️ BLOCKED | Cannot proceed | Report blocker to user |

### Updating Progress

When you complete a task:
1. Change `[ ]` to `[x]` for all subtasks
2. Change 🔴 TODO to 🟢 DONE for the task
3. Update the phase progress percentage
4. Add completion date
5. Note any important details

---

## Project Architecture Quick Reference

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, wagmi, ethers.js v6
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (TypeORM), Redis
- **Blockchain**: BSC Mainnet, PancakeSwap V3/V4
- **State**: Zustand (client), TanStack React Query (server)

### Key Contract Addresses (BSC Mainnet)
```
PancakeSwap V3 Factory:        0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865
PancakeSwap V3 PositionManager: 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364
PancakeSwap V3 Router:         0x13f4EA83D0bd40E75C8222255bc855a974568Dd4
USDT:                          0x55d398326f99059fF775485246999027B3197955
WBNB:                          0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
```

### Core Features (in order of implementation)
1. Wallet connection (MetaMask/WalletConnect)
2. Token search by contract address
3. Pool discovery and browsing
4. Add liquidity with concentrated range
5. View and manage positions
6. **Quick Exit**: Remove liquidity + auto-swap to USDT ⚡

---

## Phase 1: Foundation & Infrastructure

**Goal:** Setup complete development environment with working frontend and backend servers  
**Priority:** 🔴 CRITICAL - Must complete first  
**Estimated:** 2-3 days  
**Progress:** 0% (0/15 tasks)

### 1.1 Backend Project Setup

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** None - This is the first task  
**Assigned To:** Backend Developer Agent  

#### What needs to be done:

Initialize the backend project with all necessary configuration and dependencies.

#### Subtasks:

- [ ] 1.1.1 Create/update `backend/package.json` with all dependencies:
  ```json
  {
    "dependencies": {
      "express": "^4.18.0",
      "cors": "^2.8.5",
      "dotenv": "^16.4.0",
      "ethers": "^6.10.0",
      "axios": "^1.6.0",
      "node-cron": "^3.0.0",
      "redis": "^4.6.0",
      "pg": "^8.11.0",
      "typeorm": "^0.3.20",
      "reflect-metadata": "^0.2.1",
      "winston": "^3.11.0",
      "zod": "^3.22.0"
    },
    "devDependencies": {
      "@types/express": "^4.17.0",
      "@types/cors": "^2.8.0",
      "@types/node": "^20.11.0",
      "@types/node-cron": "^3.0.0",
      "typescript": "^5.3.0",
      "nodemon": "^3.0.0",
      "ts-node": "^10.9.0",
      "eslint": "^8.56.0",
      "jest": "^29.7.0",
      "@types/jest": "^29.5.0"
    }
  }
  ```

- [ ] 1.1.2 Create/update `backend/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "es2020",
      "module": "commonjs",
      "lib": ["es2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "moduleResolution": "node"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }
  ```

- [ ] 1.1.3 Create `backend/.env.example`:
  ```
  PORT=3001
  NODE_ENV=development
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=your_password
  DB_NAME=liquidity_manager
  REDIS_URL=redis://localhost:6379
  BSC_RPC_URL=https://bsc-dataseed.binance.org
  BSC_WS_URL=wss://bsc-ws-node.nariox.org:443
  LOG_LEVEL=info
  ```

- [ ] 1.1.4 Create `backend/src/index.ts` - Express server entry point with:
  - CORS middleware
  - JSON parsing
  - Health check endpoint at `/health`
  - Error handling middleware
  - Winston logger setup
  - Server listening on port from env

- [ ] 1.1.5 Create `backend/src/config/env.ts` - Environment configuration with all variables

- [ ] 1.1.6 Create `backend/src/utils/logger.ts` - Winston logger configuration

- [ ] 1.1.7 Create directory structure:
  ```
  backend/src/
  ├── routes/
  ├── controllers/
  ├── services/
  ├── entities/
  ├── config/
  ├── utils/
  └── types/
  ```

- [ ] 1.1.8 Add npm scripts to package.json:
  ```json
  {
    "scripts": {
      "dev": "nodemon src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "test": "jest",
      "lint": "eslint src/**/*.ts"
    }
  }
  ```

- [ ] 1.1.9 Run `npm install` in backend directory

- [ ] 1.1.10 Test: Run `npm run dev` and verify server starts on localhost:3001

#### Verification:
- [ ] Server starts without errors
- [ ] GET http://localhost:3001/health returns `{"status": "ok"}`
- [ ] TypeScript compiles without errors
- [ ] Nodemon hot reload works

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 1.2 Database Setup (PostgreSQL + TypeORM)

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 1.1 (Backend setup)  
**Assigned To:** Backend Developer Agent  

#### What needs to be done:

Setup PostgreSQL database with TypeORM and create all entity models.

#### Subtasks:

- [ ] 1.2.1 Create `backend/src/entities/Token.ts`:
  ```typescript
  @Entity()
  export class Token {
    @PrimaryColumn({ length: 42 })
    address: string;

    @Column({ length: 20 })
    symbol: string;

    @Column({ length: 100 })
    name: string;

    @Column()
    decimals: number;

    @Column({ nullable: true })
    logoUri: string;

    @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
    priceUsd: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    totalLiquidity: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    volume24h: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```

- [ ] 1.2.2 Create `backend/src/entities/Pool.ts`:
  ```typescript
  @Entity()
  export class Pool {
    @PrimaryColumn({ length: 42 })
    address: string;

    @Column({ length: 42 })
    token0Address: string;

    @Column({ length: 42 })
    token1Address: string;

    @Column()
    fee: number;

    @Column()
    tickSpacing: number;

    @Column({ nullable: true })
    sqrtPriceX96: string;

    @Column({ nullable: true })
    tick: number;

    @Column({ nullable: true })
    liquidity: string;

    @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
    tvlUsd: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    volume24h: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    fee24h: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
    apr: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```

- [ ] 1.2.3 Create `backend/src/entities/Position.ts`:
  ```typescript
  @Entity()
  export class Position {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    tokenId: string;

    @Column({ length: 42 })
    ownerAddress: string;

    @Column({ length: 42 })
    poolAddress: string;

    @Column()
    tickLower: number;

    @Column()
    tickUpper: number;

    @Column()
    liquidity: string;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    amount0: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    amount1: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    unclaimedFees0: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    unclaimedFees1: number;

    @Column({ nullable: true })
    inRange: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```

- [ ] 1.2.4 Create `backend/src/entities/Transaction.ts`:
  ```typescript
  @Entity()
  export class Transaction {
    @PrimaryColumn({ length: 66 })
    hash: string;

    @Column({ length: 42 })
    userAddress: string;

    @Column({ length: 20 })
    type: string; // 'add', 'remove', 'swap'

    @Column({ length: 20 })
    status: string; // 'pending', 'success', 'failed'

    @Column({ length: 42, nullable: true })
    poolAddress: string;

    @Column({ nullable: true })
    tokenId: string;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    amountIn: number;

    @Column({ type: 'decimal', precision: 30, scale: 8, nullable: true })
    amountOut: number;

    @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
    gasUsed: number;

    @CreateDateColumn()
    timestamp: Date;
  }
  ```

- [ ] 1.2.5 Create TypeORM configuration in `backend/src/config/database.ts`:
  ```typescript
  import { DataSource } from 'typeorm';
  import { config } from './env';

  export const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.dbHost,
    port: config.dbPort,
    username: config.dbUsername,
    password: config.dbPassword,
    database: config.dbName,
    synchronize: config.nodeEnv === 'development',
    logging: config.nodeEnv === 'development',
    entities: [__dirname + '/../entities/*.ts'],
  });
  ```

- [ ] 1.2.6 Update `backend/src/index.ts` to initialize database connection on startup

- [ ] 1.2.7 Create `docker-compose.yml` in project root for local PostgreSQL + Redis:
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_DB: liquidity_manager
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"

  volumes:
    postgres_data:
  ```

- [ ] 1.2.8 Add database npm scripts to `package.json`:
  ```json
  {
    "scripts": {
      "db:start": "docker-compose up -d",
      "db:stop": "docker-compose down",
      "db:migrate": "typeorm migration:run -d src/config/database.ts",
      "db:revert": "typeorm migration:revert -d src/config/database.ts"
    }
  }
  ```

#### Verification:
- [ ] Docker Compose starts PostgreSQL and Redis successfully
- [ ] Database connection works
- [ ] All 4 tables are created (token, pool, position, transaction)
- [ ] Can insert and query data

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 1.3 Frontend Project Setup

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 1.1 (can be done in parallel)  
**Assigned To:** Frontend Developer Agent  

#### What needs to be done:

Initialize the Next.js frontend with all necessary dependencies and configuration.

#### Subtasks:

- [ ] 1.3.1 Create/update `frontend/package.json`:
  ```json
  {
    "dependencies": {
      "next": "^14.1.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "ethers": "^6.10.0",
      "viem": "^2.7.0",
      "wagmi": "^2.5.0",
      "@tanstack/react-query": "^5.17.0",
      "axios": "^1.6.0",
      "zustand": "^4.5.0",
      "recharts": "^2.10.0",
      "tailwindcss": "^3.4.0",
      "autoprefixer": "^10.4.0",
      "postcss": "^8.4.0",
      "@headlessui/react": "^1.7.0",
      "date-fns": "^3.2.0"
    },
    "devDependencies": {
      "@types/node": "^20.11.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "typescript": "^5.3.0",
      "eslint": "^8.56.0",
      "eslint-config-next": "^14.1.0"
    }
  }
  ```

- [ ] 1.3.2 Create/update `frontend/tsconfig.json` with Next.js configuration

- [ ] 1.3.3 Create `frontend/next.config.js`:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    env: {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org',
    },
  }
  module.exports = nextConfig
  ```

- [ ] 1.3.4 Create `frontend/tailwind.config.js` with custom color theme matching specification

- [ ] 1.3.5 Create `frontend/postcss.config.js`

- [ ] 1.3.6 Create `frontend/.env.example`:
  ```
  NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
  NEXT_PUBLIC_RPC_URL=https://bsc-dataseed.binance.org
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
  NEXT_PUBLIC_CHAIN_ID=56
  NEXT_PUBLIC_CHAIN_NAME=BSC Mainnet
  ```

- [ ] 1.3.7 Create `frontend/src/styles/globals.css` with Tailwind directives and custom styles

- [ ] 1.3.8 Create `frontend/src/app/layout.tsx`:
  ```tsx
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import '../styles/globals.css'
  import { Providers } from '@/components/providers'

  const inter = Inter({ subsets: ['latin'] })

  export const metadata: Metadata = {
    title: 'Liquidity Manager - PancakeSwap V3/V4',
    description: 'Manage liquidity positions on PancakeSwap V3/V4',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    )
  }
  ```

- [ ] 1.3.9 Create `frontend/src/app/page.tsx` with basic dashboard placeholder

- [ ] 1.3.10 Create `frontend/src/components/providers.tsx` with:
  - WagmiConfig setup for BSC chain
  - TanStack Query Provider
  - QueryClient configuration with default options

- [ ] 1.3.11 Create directory structure:
  ```
  frontend/src/
  ├── app/
  ├── components/
  │   ├── pool/
  │   ├── position/
  │   ├── token/
  │   ├── liquidity/
  │   ├── quick-actions/
  │   └── common/
  ├── lib/
  ├── hooks/
  ├── types/
  ├── utils/
  └── styles/
  ```

- [ ] 1.3.12 Run `npm install` in frontend directory

- [ ] 1.3.13 Test: Run `npm run dev` and verify Next.js starts on localhost:3000

#### Verification:
- [ ] Next.js dev server starts on localhost:3000
- [ ] TailwindCSS styles work
- [ ] TypeScript compiles without errors
- [ ] Providers component loads without errors
- [ ] Can access localhost:3000 in browser

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 1.4 Shared Types & Contracts

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Tasks 1.1, 1.3 (can be done in parallel)  
**Assigned To:** Backend or Frontend Agent  

#### What needs to be done:

Create shared TypeScript types and import contract ABIs.

#### Subtasks:

- [ ] 1.4.1 Create `contracts/types/index.ts` with all shared interfaces:
  ```typescript
  export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    priceUSD?: number;
  }

  export interface Pool {
    address: string;
    token0: Token;
    token1: Token;
    fee: number;
    tickSpacing: number;
    sqrtPriceX96: string;
    tick: number;
    liquidity: string;
    tvl: number;
    volume24h: number;
    fee24h: number;
    apr: number;
  }

  export interface Position {
    tokenId: string;
    pool: Pool;
    owner: string;
    tickLower: number;
    tickUpper: number;
    liquidity: string;
    amount0: number;
    amount1: number;
    unclaimedFees0: number;
    unclaimedFees1: number;
    inRange: boolean;
  }

  export interface AddLiquidityParams {
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount0Desired: string;
    amount1Desired: string;
    amount0Min: string;
    amount1Min: string;
    recipient: string;
    deadline: number;
  }

  export interface RemoveLiquidityParams {
    tokenId: string;
    liquidity: string;
    amount0Min: string;
    amount1Min: string;
    deadline: number;
  }
  ```

- [ ] 1.4.2 Create `contracts/types/addresses.ts` with all contract addresses:
  ```typescript
  export const CONTRACTS = {
    V3: {
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      positionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
      router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
      quoter: '0xB04AB998Ae2b4a033B33D20ea8cF80B9Fe0bB189',
    },
    tokens: {
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    },
    feeTiers: [100, 500, 2500, 10000],
  } as const;

  export const TICK_SPACING: Record<number, number> = {
    100: 1,
    500: 10,
    2500: 50,
    10000: 200,
  };
  ```

- [ ] 1.4.3 Verify contract ABIs exist in `contracts/abis/`:
  - PancakeV3Factory.json
  - PancakeV3Pool.json
  - PancakeV3PositionManager.json
  - PancakeV3Router.json

- [ ] 1.4.4 Create `frontend/src/types/index.ts` that re-exports shared types

- [ ] 1.4.5 Create `backend/src/types/index.ts` that re-exports shared types

- [ ] 1.4.6 Create `frontend/src/utils/constants.ts` with popular tokens list, fee tier labels, slippage defaults

- [ ] 1.4.7 Create `frontend/src/lib/api.ts` with axios client:
  ```typescript
  import axios from 'axios';

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  // API modules
  export const poolsApi = {
    getAll: (params?: any) => api.get('/api/pools', { params }),
    getByToken: (token: string) => api.get(`/api/pools/by-token/${token}`),
    getDetails: (address: string) => api.get(`/api/pools/${address}`),
  };

  export const tokensApi = {
    getPopular: () => api.get('/api/tokens'),
    search: (query: string) => api.get(`/api/tokens/search/${query}`),
    getInfo: (address: string) => api.get(`/api/tokens/${address}`),
  };

  export const positionsApi = {
    getUserPositions: (wallet: string) => api.get(`/api/positions/user/${wallet}`),
    addLiquidity: (params: any) => api.post('/api/positions/add', params),
    removeLiquidity: (params: any) => api.post('/api/positions/remove', params),
    removeAndSwapToUSDT: (params: any) => api.post('/api/positions/remove-and-swap', params),
  };
  ```

#### Verification:
- [ ] All types compile without errors
- [ ] Contract ABIs are valid JSON
- [ ] API client can import and configure correctly
- [ ] Constants are accessible

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 1.5 Development Workflow Setup

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Tasks 1.1-1.4  
**Assigned To:** Backend or Frontend Agent  

#### What needs to be done:

Setup ESLint, Prettier, root package.json with dev scripts, and .gitignore.

#### Subtasks:

- [ ] 1.5.1 Create root `package.json` with concurrent dev scripts:
  ```json
  {
    "name": "liquidity-manager",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
      "dev:frontend": "cd frontend && npm run dev",
      "dev:backend": "cd backend && npm run dev",
      "build": "npm run build:frontend && npm run build:backend",
      "build:frontend": "cd frontend && npm run build",
      "build:backend": "cd backend && npm run build",
      "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install"
    },
    "devDependencies": {
      "concurrently": "^8.2.0"
    }
  }
  ```

- [ ] 1.5.2 Create root `.gitignore`:
  ```
  node_modules/
  .next/
  dist/
  .env
  .env.local
  *.log
  logs/
  .DS_Store
  ```

- [ ] 1.5.3 Setup ESLint for frontend (`.eslintrc.json` in frontend/)

- [ ] 1.5.4 Setup ESLint for backend (`.eslintrc.json` in backend/)

- [ ] 1.5.5 Create `README.md` with project overview and setup instructions

#### Verification:
- [ ] `npm run dev` starts both frontend and backend
- [ ] `npm run install:all` installs all dependencies
- [ ] ESLint runs without configuration errors
- [ ] .gitignore excludes proper files

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 1 Completion Checklist

Before moving to Phase 2, verify all of the following:

- [ ] 🔴 Backend server starts on localhost:3001
- [ ] 🔴 Health endpoint responds: GET /health
- [ ] 🔴 PostgreSQL running on localhost:5432
- [ ] 🔴 Redis running on localhost:6379
- [ ] 🔴 All 4 database tables created
- [ ] 🔴 Frontend server starts on localhost:3000
- [ ] 🔴 Next.js renders homepage
- [ ] 🔴 TailwindCSS styles work
- [ ] 🔴 Web3 providers configured (wagmi)
- [ ] 🔴 API client configured (axios)
- [ ] 🔴 Shared types compile correctly
- [ ] 🔴 Contract ABIs imported
- [ ] [ ] `npm run dev` starts both servers
- [ ] 🔴 Can connect to localhost:3000 in browser

**Phase 1 Status:** 🔴 NOT STARTED (0/15 tasks complete)  
**Next Step:** Start Task 1.1 (Backend Project Setup)

---

## Phase 2: Backend Core API

**Goal:** Implement all backend services, routes, and business logic  
**Priority:** 🔴 CRITICAL - Start after Phase 1  
**Estimated:** 5-7 days  
**Progress:** 0% (0/22 tasks)

### 2.1 Web3 Service

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Phase 1 complete  
**Assigned To:** Web3/Backend Agent  

#### What needs to be done:

Create the core Web3Service that handles all blockchain interactions.

#### Subtasks:

- [ ] 2.1.1 Create `backend/src/services/web3Service.ts` with class Web3Service

- [ ] 2.1.2 Initialize BSC JSON-RPC provider in constructor:
  ```typescript
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.bscRpcUrl);
  }
  ```

- [ ] 2.1.3 Implement factory contract interaction methods:
  - `getPool(tokenA, tokenB, fee)` - returns pool address
  - `scanPoolCreatedEvents(fromBlock, toBlock)` - returns new pools

- [ ] 2.1.4 Implement pool contract interaction methods:
  - `getPoolDetails(poolAddress)` - returns slot0, liquidity, tokens
  - `getPoolSlot0(poolAddress)` - returns price, tick, etc.

- [ ] 2.1.5 Implement position manager contract methods:
  - `getUserPositionCount(walletAddress)` - returns NFT balance
  - `getPosition(tokenId)` - returns position details
  - `buildMintTransaction(params)` - returns populated tx

- [ ] 2.1.6 Implement token interaction methods:
  - `getTokenInfo(tokenAddress)` - returns symbol, name, decimals
  - `getTokenBalance(tokenAddress, walletAddress)` - returns balance
  - `getAllowance(tokenAddress, owner, spender)` - returns allowance

- [ ] 2.1.7 Implement utility methods:
  - `getCurrentBlock()` - returns block number
  - `getGasPrice()` - returns current gas price
  - `estimateGas(tx)` - returns gas estimate

- [ ] 2.1.8 Add error handling and retry logic for all RPC calls

- [ ] 2.1.9 Export singleton instance: `export const web3Service = new Web3Service();`

#### Verification:
- [ ] Can fetch token info from BSC
- [ ] Can get pool details from contract
- [ ] Can scan Factory events
- [ ] Error handling works for invalid addresses
- [ ] Retry logic works for failed requests

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.2 Token Service & API

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 2.1 (Web3Service)  
**Assigned To:** Backend Agent  

#### What needs to be done:

Create token-related services, controllers, and routes.

#### Subtasks:

- [ ] 2.2.1 Create `backend/src/services/tokenService.ts` with TokenService class

- [ ] 2.2.2 Implement `getPopularTokens()`:
  - Return hardcoded list of popular BSC tokens (USDT, USDC, WBNB, CAKE, ETH, BTCB)
  - Use addresses from CONTRACTS.tokens

- [ ] 2.2.3 Implement `searchTokens(query: string)`:
  - Search database tokens by symbol, name, or address
  - Return matching results

- [ ] 2.2.4 Implement `getTokenInfo(address: string)`:
  - First check database cache
  - If not found, fetch from blockchain via web3Service
  - Save to database
  - Return token info

- [ ] 2.2.5 Implement `importToken(address: string)`:
  - Validate address format (0x + 40 hex chars)
  - Check if already exists
  - Fetch from blockchain
  - Save to database
  - Return token info or throw error

- [ ] 2.2.6 Create `backend/src/controllers/tokenController.ts` with TokenController class

- [ ] 2.2.7 Create `backend/src/routes/tokens.ts`:
  ```typescript
  GET    /api/tokens                      -> getPopularTokens
  GET    /api/tokens/search/:query        -> searchTokens
  GET    /api/tokens/:address             -> getTokenInfo
  POST   /api/tokens/import               -> importCustomToken
  ```

- [ ] 2.2.8 Add Zod validation schemas for all endpoints

- [ ] 2.2.9 Import routes in `backend/src/index.ts`

#### API Response Examples:

**GET /api/tokens:**
```json
[
  {
    "address": "0x55d398326f99059fF775485246999027B3197955",
    "symbol": "USDT",
    "name": "Tether USD",
    "decimals": 18,
    "priceUSD": 1.00
  }
]
```

**GET /api/tokens/0x...:**
```json
{
  "address": "0x...",
  "symbol": "TOKEN",
  "name": "Token Name",
  "decimals": 18,
  "priceUSD": 0.00
}
```

#### Verification:
- [ ] GET /api/tokens returns popular tokens list
- [ ] GET /api/tokens/search/USDT finds USDT
- [ ] GET /api/tokens/:address fetches from blockchain
- [ ] POST /api/tokens/import validates and imports
- [ ] Invalid address returns 400 error

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.3 Pool Service & API

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 2.1 (Web3Service), 2.2 (TokenService)  
**Assigned To:** Backend Agent  

#### What needs to be done:

Create pool-related services, controllers, and routes with filtering, sorting, and pagination.

#### Subtasks:

- [ ] 2.3.1 Create `backend/src/services/poolService.ts` with PoolService class

- [ ] 2.3.2 Implement `getAllPools(params)`:
  - Query database with filters (token, feeTiers, minTVL, maxTVL)
  - Support sorting (tvl, apr, volume, fee)
  - Support pagination (page, limit)
  - Return pools array + pagination metadata

- [ ] 2.3.3 Implement `getPoolsByToken(tokenAddress)`:
  - Find all pools where token0 or token1 matches
  - Return sorted by TVL

- [ ] 2.3.4 Implement `getPoolDetails(poolAddress)`:
  - Get pool from database
  - Fetch latest data from blockchain
  - Update database
  - Return detailed pool info

- [ ] 2.3.5 Implement `scanNewPools()`:
  - Query Factory contract for PoolCreated events
  - For each new pool:
    - Fetch pool details from blockchain
    - Fetch token info for both tokens
    - Save pool to database
    - Log the new pool
  - Return count of pools found

- [ ] 2.3.6 Implement `updatePoolMetrics(poolAddress)`:
  - Fetch current state from blockchain
  - Calculate TVL (liquidity * price)
  - Calculate APR (fees * 365 / TVL * 100)
  - Update database

- [ ] 2.3.7 Create `backend/src/controllers/poolController.ts`

- [ ] 2.3.8 Create `backend/src/routes/pools.ts`:
  ```typescript
  GET    /api/pools                           -> getAllPools
  GET    /api/pools/by-token/:tokenAddress    -> getPoolsByToken
  GET    /api/pools/:poolAddress              -> getPoolDetails
  POST   /api/pools/scan                      -> scanNewPools
  ```

- [ ] 2.3.9 Add Zod validation for all pool endpoints

- [ ] 2.3.10 Import routes in index.ts

#### Verification:
- [ ] GET /api/pools returns pool list
- [ ] Filtering by token works
- [ ] Sorting by TVL/APR works
- [ ] Pagination works
- [ ] POST /api/pools/scan finds and saves pools
- [ ] Pool details include blockchain data

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.4 Price Service & Caching

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 2.1 (Web3Service), 2.3 (PoolService)  
**Assigned To:** Backend Agent  

#### What needs to be done:

Implement token price fetching, caching, and TVL/APR calculations.

#### Subtasks:

- [ ] 2.4.1 Create `backend/src/services/priceService.ts` with PriceService class

- [ ] 2.4.2 Setup Redis client connection

- [ ] 2.4.3 Implement `getTokenPrice(tokenAddress)`:
  - Check Redis cache first (TTL: 30 seconds)
  - If cache miss, fetch from pool data or external API
  - Cache result in Redis
  - Return price

- [ ] 2.4.4 Implement `calculateTVL(liquidity, token0Price, token1Price)`

- [ ] 2.4.5 Implement `calculateAPR(fee24h, tvl)`

- [ ] 2.4.6 Implement cache helper methods:
  - `cacheSet(key, value, ttl)`
  - `cacheGet(key)`
  - `cacheDelete(key)`

- [ ] 2.4.7 Add cache invalidation logic

#### Verification:
- [ ] Redis caching works
- [ ] Cache TTL expires correctly
- [ ] TVL calculation is accurate
- [ ] APR calculation is correct

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.5 Position Service & API

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 2.1 (Web3Service)  
**Assigned To:** Web3/Backend Agent  

#### What needs to be done:

Create position-related services including transaction builders for all position operations.

#### Subtasks:

- [ ] 2.5.1 Create `backend/src/services/positionService.ts` with PositionService class

- [ ] 2.5.2 Implement `getUserPositions(walletAddress)`:
  - Query PositionManager for user's NFT balance
  - Loop through token IDs
  - Fetch details for each position
  - Check if in range
  - Return positions array

- [ ] 2.5.3 Implement `getPositionDetails(tokenId)`:
  - Fetch position from PositionManager
  - Get current pool tick
  - Determine if in range
  - Calculate unclaimed fees
  - Return detailed position

- [ ] 2.5.4 Implement `buildAddLiquidityTransaction(params)`:
  ```typescript
  const tx = await positionManager.mint.populateTransaction({
    token0: params.token0,
    token1: params.token1,
    fee: params.fee,
    tickLower: params.tickLower,
    tickUpper: params.tickUpper,
    amount0Desired: params.amount0Desired,
    amount1Desired: params.amount1Desired,
    amount0Min: params.amount0Min,
    amount1Min: params.amount1Min,
    recipient: params.recipient,
    deadline: params.deadline,
  });
  return { to: tx.to, data: tx.data, value: '0' };
  ```

- [ ] 2.5.5 Implement `buildRemoveLiquidityTransaction(params)`:
  - Build decreaseLiquidity transaction
  - Build collect transaction
  - Return both

- [ ] 2.5.6 Implement `buildRemoveAndSwapToUSDT(params)` ⚡ **CRITICAL FEATURE**:
  - Build decreaseLiquidity transaction (step 1)
  - Build collect transaction (step 2)
  - Build swap token0 → USDT via Router (step 3)
  - Build swap token1 → USDT via Router (step 4)
  - Calculate expected USDT output
  - Calculate minimum USDT with slippage
  - Return all 4 transactions with summary

- [ ] 2.5.7 Implement `checkPositionInRange(tokenId)`:
  - Get position tick range
  - Get current pool tick
  - Determine if current tick is within position range
  - Return boolean + details

- [ ] 2.5.8 Create `backend/src/controllers/positionController.ts`

- [ ] 2.5.9 Create `backend/src/routes/positions.ts`:
  ```typescript
  GET    /api/positions/user/:walletAddress    -> getUserPositions
  GET    /api/positions/:positionId            -> getPositionDetails
  POST   /api/positions/add                    -> addLiquidity
  POST   /api/positions/remove                 -> removeLiquidity
  POST   /api/positions/remove-and-swap        -> removeAndSwapToUSDT
  ```

- [ ] 2.5.10 Add comprehensive Zod validation for all endpoints

#### Verification:
- [ ] Can fetch user positions from blockchain
- [ ] Can build add liquidity transaction
- [ ] Can build remove liquidity transaction
- [ ] Can build remove + swap to USDT transactions
- [ ] All transactions have correct parameters
- [ ] Slippage calculated correctly

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.6 Transaction Service & API

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 2.5 (PositionService)  
**Assigned To:** Backend Agent  

#### What needs to be done:

Create transaction history tracking and transaction status checking.

#### Subtasks:

- [ ] 2.6.1 Create `backend/src/services/transactionService.ts`

- [ ] 2.6.2 Implement `getUserTransactions(walletAddress)`:
  - Query database for user's transactions
  - Filter by type if provided
  - Sort by timestamp descending
  - Return transactions array

- [ ] 2.6.3 Implement `getTransactionStatus(hash)`:
  - Query blockchain for transaction receipt
  - Return status, block number, gas used
  - Update database

- [ ] 2.6.4 Implement `logTransaction(txData)`:
  - Save transaction to database
  - Used after user executes a transaction

- [ ] 2.6.5 Create `backend/src/controllers/transactionController.ts`

- [ ] 2.6.6 Create `backend/src/routes/transactions.ts`:
  ```typescript
  GET    /api/transactions/user/:walletAddress  -> getUserTransactions
  GET    /api/transactions/tx/:hash             -> getTransactionStatus
  POST   /api/transactions/build-add            -> buildAddLiquidityTx
  POST   /api/transactions/build-remove         -> buildRemoveLiquidityTx
  POST   /api/transactions/build-swap           -> buildSwapToUSDTTx
  ```

#### Verification:
- [ ] Can fetch user transaction history
- [ ] Can check transaction status on blockchain
- [ ] Transactions are logged to database

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.7 Background Jobs (Cron)

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 2.3 (PoolService), 2.4 (PriceService)  
**Assigned To:** Backend Agent  

#### What needs to be done:

Setup automated background jobs for pool scanning and position monitoring.

#### Subtasks:

- [ ] 2.7.1 Create `backend/src/services/cronService.ts`

- [ ] 2.7.2 Setup node-cron scheduler

- [ ] 2.7.3 Implement Pool Scanner job (runs every 5 minutes):
  ```typescript
  cron.schedule('*/5 * * * *', async () => {
    await poolService.scanNewPools();
    await poolService.updateAllPoolMetrics();
    await priceService.refreshTokenPrices();
  });
  ```

- [ ] 2.7.4 Implement Position Monitor job (runs every 1 minute):
  ```typescript
  cron.schedule('* * * * *', async () => {
    await positionService.checkAllPositionsInRange();
    await positionService.updateAllUnclaimedFees();
  });
  ```

- [ ] 2.7.5 Add error handling for cron jobs (don't crash server)

- [ ] 2.7.6 Add logging for each cron execution

- [ ] 2.7.7 Start cron service in `backend/src/index.ts`

#### Verification:
- [ ] Pool scanner runs every 5 minutes
- [ ] Position monitor runs every 1 minute
- [ ] Errors don't crash the server
- [ ] Logs show cron execution

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 2.8 Error Handling & Validation

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** All Phase 2 tasks  
**Assigned To:** Backend Agent  

#### What needs to be done:

Implement comprehensive error handling across all services and routes.

#### Subtasks:

- [ ] 2.8.1 Create global error handling middleware in index.ts:
  ```typescript
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }
    });
  });
  ```

- [ ] 2.8.2 Create standard error response format

- [ ] 2.8.3 Add try-catch to all controller methods

- [ ] 2.8.4 Create custom error classes (ValidationError, NotFoundError, etc.)

- [ ] 2.8.5 Add Zod error formatting to return user-friendly messages

- [ ] 2.8.6 Add RPC error handling (timeouts, rate limits, etc.)

- [ ] 2.8.7 Create error codes documentation

#### Verification:
- [ ] All errors return consistent format
- [ ] Validation errors are user-friendly
- [ ] RPC errors are handled gracefully
- [ ] Server doesn't crash on errors

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 2 Completion Checklist

- [ ] 🔴 Web3Service complete and tested
- [ ] 🔴 Token API working (4 endpoints)
- [ ] 🔴 Pool API with filtering/sorting/pagination (4 endpoints)
- [ ] 🔴 Price service with Redis caching
- [ ] 🔴 Position API with transaction builders (5 endpoints)
- [ ] 🔴 Transaction API with history (5 endpoints)
- [ ] 🔴 Background jobs running (pool scanner, position monitor)
- [ ] 🔴 Error handling comprehensive
- [ ] 🔴 All endpoints tested with Postman/curl
- [ ] [ ] Blockchain data accessible
- [ ] 🔴 No critical errors in logs

**Phase 2 Status:** 🔴 NOT STARTED (0/22 tasks complete)  
**Next Step:** After Phase 1, start Task 2.1 (Web3 Service)

---

## Phase 3: Frontend UI & Components

**Goal:** Build all user interface components and pages  
**Priority:** 🔴 CRITICAL - Can start after Phase 1 (parallel with Phase 2)  
**Estimated:** 5-7 days  
**Progress:** 0% (0/30 tasks)

### 3.1 Wallet Connection & Layout

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Phase 1 complete  
**Assigned To:** Frontend Agent  

#### What needs to be done:

Create the main layout, header, and wallet connection functionality.

#### Subtasks:

- [ ] 3.1.1 Create `frontend/src/components/WalletConnect.tsx`:
  ```tsx
  'use client';
  import { useAccount, useConnect, useDisconnect } from 'wagmi';

  export function WalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnected && address) {
      return (
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-darker rounded-lg">
            <span className="text-success text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      );
    }

    return <button onClick={() => connect({ connector: connectors[0] })}>Connect Wallet</button>;
  }
  ```

- [ ] 3.1.2 Create main dashboard layout in `frontend/src/components/dashboard.tsx`:
  - Header with logo and WalletConnect
  - Tab navigation (Pools, Positions, Add Liquidity)
  - Main content area
  - Quick Exit button in header area

- [ ] 3.1.3 Implement network detection:
  - Check if connected to BSC (chain ID 56)
  - If wrong network, show warning modal
  - Add "Switch to BSC" button

- [ ] 3.1.4 Add responsive design for mobile

- [ ] 3.1.5 Test wallet connection flow

#### Verification:
- [ ] Can connect MetaMask wallet
- [ ] Wallet address displays correctly
- [ ] Can disconnect
- [ ] Network detection works
- [ ] Layout responsive on mobile

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.2 Common UI Components

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.1  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create reusable UI component library.

#### Subtasks:

- [ ] 3.2.1 Create Button component with variants (primary, secondary, danger, outline)
- [ ] 3.2.2 Create Input component with validation and error states
- [ ] 3.2.3 Create Modal component with overlay and close button
- [ ] 3.2.4 Create Card component
- [ ] 3.2.5 Create Loading/Skeleton component
- [ ] 3.2.6 Create Badge component for status indicators
- [ ] 3.2.7 Create Toast/Notification component
- [ ] 3.2.8 Create EmptyState component
- [ ] 3.2.9 Test all components in isolation

#### Verification:
- [ ] All components render correctly
- [ ] Components are reusable
- [ ] Props are typed correctly
- [ ] Responsive on mobile

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.3 Token Management UI

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.2  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create token selector and token management interface.

#### Subtasks:

- [ ] 3.3.1 Create `frontend/src/components/token/TokenSelector.tsx`:
  - Input field for contract address
  - Search popular tokens
  - Display token info (symbol, name, decimals)
  - Import custom token modal

- [ ] 3.3.2 Implement token address validation
- [ ] 3.3.3 Add popular tokens quick selection
- [ ] 3.3.4 Create TokenImportModal component
- [ ] 3.3.5 Integrate with backend Token API
- [ ] 3.3.6 Add loading and error states

#### Verification:
- [ ] Can search token by address
- [ ] Token metadata displays
- [ ] Can import custom tokens
- [ ] Validation works

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.4 Pool List UI

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.3, Backend Pool API  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create pool list with filtering, sorting, and pagination.

#### Subtasks:

- [ ] 3.4.1 Create PoolCard component showing:
  - Token pair with logos
  - Fee tier badge
  - TVL, APR, Volume
  - Current price

- [ ] 3.4.2 Create PoolList component with grid/list view

- [ ] 3.4.3 Create PoolFilters component:
  - Fee tier checkboxes
  - TVL range slider
  - Token filter

- [ ] 3.4.4 Add sorting controls (TVL, APR, Volume)

- [ ] 3.4.5 Implement pagination

- [ ] 3.4.6 Add loading skeletons

- [ ] 3.4.7 Integrate with backend Pool API via React Query

- [ ] 3.4.8 Add auto-refresh every 30 seconds

#### Verification:
- [ ] Pool list loads from backend
- [ ] Filters work correctly
- [ ] Sorting works
- [ ] Pagination works
- [ ] Auto-refresh updates data

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.5 Pool Details UI

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 3.4  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create pool details page with comprehensive information.

#### Subtasks:

- [ ] 3.5.1 Create pool details page at `/pools/[address]`
- [ ] 3.5.2 Display all pool statistics
- [ ] 3.5.3 Show token pair with details
- [ ] 3.5.4 Add "Add Liquidity" button
- [ ] 3.5.5 Make pool address copyable
- [ ] 3.5.6 Integrate with backend API

#### Verification:
- [ ] Pool details page loads
- [ ] All data displays correctly
- [ ] Can navigate to add liquidity

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.6 Position List UI

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.2, Backend Position API  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create user's position list with status indicators.

#### Subtasks:

- [ ] 3.6.1 Create PositionCard component:
  - Pool info (pair, fee)
  - Price range (min-max)
  - Status badge (🟢 In Range / 🔴 Out of Range)
  - Unclaimed fees
  - Action buttons

- [ ] 3.6.2 Create PositionList component

- [ ] 3.6.3 Add empty state: "No positions yet"

- [ ] 3.6.4 Integrate with backend Position API

- [ ] 3.6.5 Add loading states

- [ ] 3.6.6 Add action buttons: Remove, Quick Exit

#### Verification:
- [ ] Positions load from blockchain
- [ ] Status indicators correct
- [ ] Unclaimed fees display
- [ ] Action buttons work

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.7 Position Details UI

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 3.6  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create position details page with full information and actions.

#### Subtasks:

- [ ] 3.7.1 Create position details page at `/positions/[tokenId]`
- [ ] 3.7.2 Display comprehensive position info
- [ ] 3.7.3 Add price range visualization
- [ ] 3.7.4 Show action buttons: Add More, Remove, Quick Exit
- [ ] 3.7.5 Integrate with backend API

#### Verification:
- [ ] Position details load
- [ ] All actions available
- [ ] Range visualization works

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.8 Add Liquidity Wizard

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.4, 3.5  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create multi-step add liquidity interface.

#### Subtasks:

- [ ] 3.8.1 Create add liquidity page at `/add-liquidity`

- [ ] 3.8.2 Build step 1: Pool & Fee Tier Selection

- [ ] 3.8.3 Build step 2: Price Range Selection
  - Min/Max price inputs
  - Preset range buttons (±5%, ±10%, ±20%)
  - Visual range indicator

- [ ] 3.8.4 Build step 3: Amount Input
  - Token0 and Token1 amounts
  - Wallet balance display
  - "Max" buttons
  - Auto-calculate optimal ratio

- [ ] 3.8.5 Build step 4: Preview & Confirm
  - Summary of all parameters
  - Expected position details
  - Approve tokens if needed
  - Submit transaction button

- [ ] 3.8.6 Add validation and warnings

- [ ] 3.8.7 Build transaction status modal:
  - "Waiting for signature"
  - "Submitting..."
  - "Confirming..."
  - "Success!" or "Failed"

- [ ] 3.8.8 Integrate with backend Position API

#### Verification:
- [ ] All steps work sequentially
- [ ] Validation prevents errors
- [ ] Transaction executes correctly
- [ ] Position updates after success

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.9 Quick Exit UI ⚡

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 3.6, 3.7  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create Quick Exit interface for instant liquidity removal and USDT swap.

#### Subtasks:

- [ ] 3.9.1 Create `frontend/src/components/quick-actions/QuickSellToUSDT.tsx`

- [ ] 3.9.2 Build Quick Exit preview modal:
  - Position being removed
  - Expected tokens before swap
  - Expected USDT after swap
  - Gas estimate
  - Minimum USDT output (with slippage)

- [ ] 3.9.3 Add slippage tolerance setting

- [ ] 3.9.4 Build multi-step transaction progress UI:
  - Step 1: Removing liquidity...
  - Step 2: Collecting tokens...
  - Step 3: Swapping token0 to USDT...
  - Step 4: Swapping token1 to USDT...
  - Step 5: Complete!

- [ ] 3.9.5 Add error handling UI:
  - Show what failed
  - Show what completed
  - Recovery options

- [ ] 3.9.6 Build success summary modal:
  - Total USDT received
  - Gas spent
  - "View on BSCScan" link

- [ ] 3.9.7 Add "Exit All Positions" button to dashboard

#### Verification:
- [ ] Quick Exit preview shows correct data
- [ ] Multi-step transaction tracks progress
- [ ] Errors handled gracefully
- [ ] Success summary displays

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.10 Settings UI

**Status:** 🔴 TODO  
**Priority:** 🟢 STANDARD  
**Dependencies:** Task 3.2  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Create settings modal for user preferences.

#### Subtasks:

- [ ] 3.10.1 Create settings modal/page
- [ ] 3.10.2 Add slippage tolerance selector (Auto, 0.1%, 0.5%, 1%, Custom)
- [ ] 3.10.3 Add transaction deadline selector (10, 20, 30, 60 min)
- [ ] 3.10.4 Persist settings in localStorage
- [ ] 3.10.5 Apply settings to all transactions

#### Verification:
- [ ] Settings save to localStorage
- [ ] Settings load on page refresh
- [ ] Settings apply to transactions

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.11 State Management & Data Fetching

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Tasks 3.4-3.9  
**Assigned To:** Frontend Agent  

#### What needs to be done:

Setup Zustand store and React Query hooks for all API endpoints.

#### Subtasks:

- [ ] 3.11.1 Create Zustand store for UI state (settings, modals, etc.)

- [ ] 3.11.2 Create React Query hooks for all API endpoints:
  - `usePools(params)`
  - `usePool(address)`
  - `useTokens()`
  - `useTokenInfo(address)`
  - `useUserPositions(wallet)`
  - `usePosition(tokenId)`
  - `useUserTransactions(wallet)`

- [ ] 3.11.3 Implement auto-refetch for pool data (30s)

- [ ] 3.11.4 Implement auto-refetch for positions (60s)

- [ ] 3.11.5 Add cache invalidation on transaction success

- [ ] 3.11.6 Add error boundaries

#### Verification:
- [ ] Data auto-fetches and updates
- [ ] Cache works correctly
- [ ] Error boundaries catch errors
- [ ] State persists across navigation

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 3.12 Responsive Design & Polish

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** All Phase 3 UI tasks  
**Assigned To:** UI Components Agent  

#### What needs to be done:

Ensure responsive design works across all screen sizes and fix UI issues.

#### Subtasks:

- [ ] 3.12.1 Test on mobile (320px+)
- [ ] 3.12.2 Test on tablet (768px+)
- [ ] 3.12.3 Test on desktop (1024px+, 1440px+)
- [ ] 3.12.4 Fix responsive issues
- [ ] 3.12.5 Optimize touch targets for mobile
- [ ] 3.12.6 Add loading states everywhere
- [ ] 3.12.7 Fix any visual bugs

#### Verification:
- [ ] Works on all screen sizes
- [ ] All interactions smooth
- [ ] No visual glitches

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 3 Completion Checklist

- [ ] 🔴 Wallet connection working
- [ ] 🔴 Main layout and navigation functional
- [ ] 🔴 All common UI components built
- [ ] 🔴 Token selection working
- [ ] 🔴 Pool list with filters/sorting/pagination
- [ ] 🔴 Pool details page
- [ ] 🔴 Position list with status indicators
- [ ] 🔴 Position details page
- [ ] 🔴 Add liquidity wizard complete
- [ ] 🔴 Quick Exit UI functional
- [ ] 🔴 Settings working
- [ ] 🔴 State management configured
- [ ] 🔴 Auto-refresh working
- [ ] 🔴 Responsive on all devices
- [ ] [ ] All user flows working end-to-end

**Phase 3 Status:** 🔴 NOT STARTED (0/30 tasks complete)  
**Next Step:** After Phase 1, start Task 3.1 (Wallet Connection & Layout)

---

## Phase 4: Web3 Integration

**Goal:** Integrate all blockchain interactions and test transaction flows  
**Priority:** 🔴 CRITICAL - Start after Phase 2 & 3  
**Estimated:** 5-7 days  
**Progress:** 0% (0/18 tasks)

### 4.1 Token Approval Flow

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Phase 2, 3 complete  
**Assigned To:** Web3 Agent  

#### What needs to be done:

Implement token allowance checking and approval transaction flow.

#### Subtasks:

- [ ] 4.1.1 Create `checkAllowance(tokenAddress, owner, spender)` method
- [ ] 4.1.2 Create `buildApproveTransaction(tokenAddress, spender, amount)` method
- [ ] 4.1.3 Add approval UI in add liquidity wizard
- [ ] 4.1.4 Handle approval states (not approved → pending → approved)
- [ ] 4.1.5 Test complete approval flow

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 4.2 Add Liquidity Transaction

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 4.1  
**Assigned To:** Web3 Agent  

#### What needs to be done:

Implement complete add liquidity transaction flow with proper parameter calculation.

#### Subtasks:

- [ ] 4.2.1 Create `priceToTick(price)` conversion function
- [ ] 4.2.2 Create `tickToPrice(tick)` conversion function
- [ ] 4.2.3 Implement tick alignment to tick spacing
- [ ] 4.2.4 Calculate optimal amounts for price range
- [ ] 4.2.5 Calculate slippage tolerance amounts
- [ ] 4.2.6 Build complete mint transaction
- [ ] 4.2.7 Add transaction error handling
- [ ] 4.2.8 Add frontend transaction tracking
- [ ] 4.2.9 Update position list after success
- [ ] 4.2.10 Log transaction to backend
- [ ] 4.2.11 **Test on BSC testnet first**
- [ ] 4.2.12 **Test on mainnet with small amounts**

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 4.3 Remove Liquidity Transaction

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 4.2  
**Assigned To:** Web3 Agent  

#### What needs to be done:

Implement remove liquidity transaction flow (partial and full).

#### Subtasks:

- [ ] 4.3.1 Build decreaseLiquidity transaction
- [ ] 4.3.2 Build collect transaction
- [ ] 4.3.3 Handle partial liquidity removal
- [ ] 4.3.4 Handle full liquidity removal
- [ ] 4.3.5 Calculate minimum amounts with slippage
- [ ] 4.3.6 Add frontend for removal
- [ ] 4.3.7 Test transaction sequence on testnet
- [ ] 4.3.8 Test on mainnet

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 4.4 Quick Exit Transaction Sequence ⚡

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL (HIGHEST)  
**Dependencies:** Task 4.3  
**Assigned To:** Web3 Agent  

#### What needs to be done:

Implement the critical Quick Exit feature - multi-step transaction sequence.

#### Subtasks:

- [ ] 4.4.1 Build Step 1: decreaseLiquidity(tokenId, 100%)

- [ ] 4.4.2 Build Step 2: collect(tokenId)

- [ ] 4.4.3 Build Step 3: exactInputSingle(token0 → USDT)
  - Only if token0 ≠ USDT
  - Calculate amountOutMinimum with slippage

- [ ] 4.4.4 Build Step 4: exactInputSingle(token1 → USDT)
  - Only if token1 ≠ USDT
  - Calculate amountOutMinimum with slippage

- [ ] 4.4.5 Calculate expected USDT output for preview

- [ ] 4.4.6 Execute transactions sequentially on frontend:
  ```typescript
  const tx1 = await wallet.sendTransaction(step1);
  await tx1.wait();

  const tx2 = await wallet.sendTransaction(step2);
  await tx2.wait();

  // ... etc
  ```

- [ ] 4.4.7 Handle failures mid-sequence:
  - Stop execution
  - Show what completed
  - Offer recovery options

- [ ] 4.4.8 Add progress tracking UI

- [ ] 4.4.9 Add gas estimation for all steps

- [ ] 4.4.10 **Test complete flow on testnet**

- [ ] 4.4.11 **Test on mainnet with small position**

- [ ] 4.4.12 Test edge cases:
  - One token is already USDT
  - Both tokens are USDT
  - Very low liquidity pool

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 4.5 Pool Scanning Implementation

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 4.2  
**Assigned To:** Web3 Agent  

#### What needs to be done:

Implement automated pool scanning from Factory contract events.

#### Subtasks:

- [ ] 4.5.1 Implement Factory event scanning for PoolCreated
- [ ] 4.5.2 Parse event data
- [ ] 4.5.3 Fetch pool details for each new pool
- [ ] 4.5.4 Fetch token info for pool tokens
- [ ] 4.5.5 Save to database
- [ ] 4.5.6 Handle scanning errors
- [ ] 4.5.7 Optimize with batch requests

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 4.6 Position Monitoring

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Task 4.2  
**Assigned To:** Web3/Backend Agent  

#### What needs to be done:

Implement automated position monitoring and updates.

#### Subtasks:

- [ ] 4.6.1 Implement position status checking (in/out of range)
- [ ] 4.6.2 Update unclaimed fees
- [ ] 4.6.3 Update position amounts
- [ ] 4.6.4 Add to cron job

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 4 Completion Checklist

- [ ] 🔴 Token approval working
- [ ] 🔴 Add liquidity transaction functional on mainnet
- [ ] 🔴 Remove liquidity transaction functional on mainnet
- [ ] 🔴 Quick Exit multi-step transaction working ⚡
- [ ] 🔴 Pool scanning automated
- [ ] 🔴 Position monitoring working
- [ ] 🔴 All error cases handled
- [ ] [ ] Tested on testnet and mainnet

**Phase 4 Status:** 🔴 NOT STARTED (0/18 tasks complete)  
**Next Step:** After Phase 2 & 3, start Task 4.1 (Token Approval)

---

## Phase 5: Advanced Features

**Goal:** Implement analytics, charts, and polish  
**Priority:** 🟡 IMPORTANT - Start after Phase 4  
**Estimated:** 3-5 days  
**Progress:** 0% (0/15 tasks)

### 5.1 Charts & Analytics

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Phase 4 complete  
**Assigned To:** UI Components Agent  

#### Subtasks:

- [ ] 5.1.1 Create liquidity distribution chart for pools
- [ ] 5.1.2 Create volume 24h chart
- [ ] 5.1.3 Create APR trend chart
- [ ] 5.1.4 Create position performance chart
- [ ] 5.1.5 Make all charts responsive

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 5.2 Position Analytics

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** Phase 4  
**Assigned To:** Backend + UI Agent  

#### Subtasks:

- [ ] 5.2.1 Implement P&L calculation
- [ ] 5.2.2 Add fees earned tracking
- [ ] 5.2.3 Calculate time in range percentage
- [ ] 5.2.4 Estimate impermanent loss
- [ ] 5.2.5 Display analytics on position details

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 5.3 Performance Optimization

**Status:** 🔴 TODO  
**Priority:** 🟡 IMPORTANT  
**Dependencies:** All previous phases  
**Assigned To:** Frontend + Backend Agent  

#### Subtasks:

- [ ] 5.3.1 Optimize React component renders (React.memo)
- [ ] 5.3.2 Optimize database queries
- [ ] 5.3.3 Add query caching
- [ ] 5.3.4 Add lazy loading for components
- [ ] 5.3.5 Optimize image loading
- [ ] 5.3.6 Measure performance metrics

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 5 Completion Checklist

- [ ] 🔴 Charts rendering correctly
- [ ] 🔴 Position analytics working
- [ ] 🔴 Performance optimized
- [ ] [ ] All analytics accurate

**Phase 5 Status:** 🔴 NOT STARTED (0/15 tasks complete)  
**Next Step:** After Phase 4, start Task 5.1

---

## Phase 6: Testing & QA

**Goal:** Comprehensive testing and bug fixes  
**Priority:** 🔴 CRITICAL - Start after all development  
**Estimated:** 3-5 days  
**Progress:** 0% (0/12 tasks)

### 6.1 Backend Unit Tests

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** All backend development  
**Assigned To:** QA Agent  

#### Subtasks:

- [ ] 6.1.1 Test Web3Service
- [ ] 6.1.2 Test TokenService
- [ ] 6.1.3 Test PoolService
- [ ] 6.1.4 Test PositionService
- [ ] 6.1.5 Test all controllers
- [ ] 6.1.6 Achieve >80% code coverage

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 6.2 Frontend Tests

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** All frontend development  
**Assigned To:** QA Agent  

#### Subtasks:

- [ ] 6.2.1 Test utility functions
- [ ] 6.2.2 Test custom hooks
- [ ] 6.2.3 Test key components
- [ ] 6.2.4 Test state management
- [ ] 6.2.5 Achieve >70% code coverage

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 6.3 Manual Testing & Bug Fixes

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** All development  
**Assigned To:** All Agents  

#### Subtasks:

- [ ] 6.3.1 Test all user flows manually
- [ ] 6.3.2 Test on different browsers
- [ ] 6.3.3 Test on different devices
- [ ] 6.3.4 Test edge cases
- [ ] 6.3.5 Fix critical bugs
- [ ] 6.3.6 Fix high-priority bugs

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 6 Completion Checklist

- [ ] 🔴 Backend coverage >80%
- [ ] 🔴 Frontend coverage >70%
- [ ] 🔴 All critical bugs fixed
- [ ] 🔴 All user flows tested
- [ ] 🔴 No blockers

**Phase 6 Status:** 🔴 NOT STARTED (0/12 tasks complete)  
**Next Step:** After all development, start Task 6.1

---

## Phase 7: Deployment

**Goal:** Deploy to production and setup monitoring  
**Priority:** 🔴 CRITICAL - Final phase  
**Estimated:** 2-3 days  
**Progress:** 0% (0/8 tasks)

### 7.1 Infrastructure Setup

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Phase 6 complete  
**Assigned To:** Backend Agent  

#### Subtasks:

- [ ] 7.1.1 Provision production PostgreSQL
- [ ] 7.1.2 Provision production Redis
- [ ] 7.1.3 Run database migrations
- [ ] 7.1.4 Setup automated backups
- [ ] 7.1.5 Configure environment variables

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 7.2 Deploy Backend

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Task 7.1  
**Assigned To:** Backend Agent  

#### Subtasks:

- [ ] 7.2.1 Build backend for production
- [ ] 7.2.2 Deploy to Railway/Render
- [ ] 7.2.3 Configure custom domain
- [ ] 7.2.4 Setup SSL
- [ ] 7.2.5 Test all API endpoints

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### 7.3 Deploy Frontend

**Status:** 🔴 TODO  
**Priority:** 🔴 CRITICAL  
**Dependencies:** Phase 6 complete  
**Assigned To:** Frontend Agent  

#### Subtasks:

- [ ] 7.3.1 Build frontend for production
- [ ] 7.3.2 Deploy to Vercel
- [ ] 7.3.3 Configure custom domain
- [ ] 7.3.4 Setup SSL
- [ ] 7.3.5 Test all user flows on production

**Completed:** No  
**Completed Date:** -  
**Notes:** -

---

### Phase 7 Completion Checklist

- [ ] 🔴 Backend deployed and working
- [ ] 🔴 Frontend deployed and working
- [ ] 🔴 Database backups configured
- [ ] 🔴 Monitoring active
- [ ] 🔴 All flows tested on production

**Phase 7 Status:** 🔴 NOT STARTED (0/8 tasks complete)  
**Next Step:** After Phase 6, start Task 7.1

---

## Quick Start Guide for AI Agents

### When Starting a New Session:

1. **Read this document** from the top
2. **Find the first 🔴 TODO task** with highest priority
3. **Check dependencies** - are previous required tasks done?
4. **Read the task details** completely
5. **Execute all subtasks** marked with [ ]
6. **Update status**: Change 🔴 TODO to 🟢 DONE, check all [ ] → [x]
7. **Update phase progress** at the top of the document
8. **Report completion** to user

### Priority Order:

1. 🔴 CRITICAL - Must do first
2. 🟡 IMPORTANT - Do after critical
3. 🟢 STANDARD - Do last

### File Locations Quick Reference:

```
Backend:
  - Services:     backend/src/services/
  - Controllers:  backend/src/controllers/
  - Routes:       backend/src/routes/
  - Entities:     backend/src/entities/
  - Config:       backend/src/config/
  - Utils:        backend/src/utils/

Frontend:
  - Pages:        frontend/src/app/
  - Components:   frontend/src/components/
  - Hooks:        frontend/src/hooks/
  - Types:        frontend/src/types/
  - Utils:        frontend/src/utils/
  - API Client:   frontend/src/lib/api.ts

Contracts:
  - ABIs:         contracts/abis/
  - Types:        contracts/types/
  - Addresses:    contracts/types/addresses.ts
```

### Key Commands:

```bash
# Development
npm run dev                      # Start both frontend and backend
cd backend && npm run dev        # Start backend only
cd frontend && npm run dev       # Start frontend only

# Database
docker-compose up -d             # Start PostgreSQL + Redis
docker-compose down              # Stop services

# Installation
npm run install:all              # Install all dependencies
```

---

## Summary

**Total Tasks:** 120  
**Completed:** 0  
**Remaining:** 120  
**Next Action:** Start Task 1.1 (Backend Project Setup)

**Ready to begin?** 🚀
