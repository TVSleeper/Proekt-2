# Liquidity Manager - Project Architecture

## 1. System Overview

### 1.1 Architecture Pattern
**Monorepo** с разделением на frontend и backend (client-server architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    Liquidity Manager                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐              │
│  │  Frontend    │◄───────►│   Backend    │              │
│  │  (Next.js)   │  HTTP   │  (Express)   │              │
│  └──────┬───────┘         └──────┬───────┘              │
│         │                        │                       │
│         ▼                        ▼                       │
│  ┌──────────────┐         ┌──────────────┐              │
│  │   Browser    │         │  PostgreSQL  │              │
│  │   Web3 Wallet│         │    Redis     │              │
│  └──────────────┘         └──────┬───────┘              │
│                                  │                       │
│                                  ▼                       │
│                         ┌──────────────┐                 │
│                         │  BSC Network  │                │
│                         │ PancakeSwap  │                 │
│                         └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles
- **Separation of Concerns**: Frontend отвечает за UI, Backend за бизнес-логику
- **Stateless Backend**: Все состояние хранится в БД, backend горизонтально масштабируется
- **Non-custodial**: Backend никогда не подписывает транзакции, только строит данные
- **Cache-first**: Redis кеширует frequently-accessed данные

---

## 2. Frontend Architecture (Next.js)

### 2.1 Component Hierarchy

```
App (layout.tsx)
├── Providers (Web3, Query)
│
└── Dashboard (page.tsx)
    ├── Header
    │   ├── Logo
    │   └── WalletConnect
    │
    ├── QuickSellToUSDT (Quick Action)
    │
    ├── Tab Navigation
    │   ├── All Pools Tab
    │   ├── My Positions Tab
    │   └── Add Liquidity Tab
    │
    └── Tab Content
        ├── PoolList (All Pools)
        │   ├── PoolFilters
        │   ├── PoolCard
        │   │   └── PoolDetails
        │   └── Pagination
        │
        ├── PositionList (My Positions)
        │   ├── PositionCard
        │   │   ├── PositionDetails
        │   │   └── RemoveLiquidityButton
        │   └── EmptyState
        │
        └── AddLiquidityFlow
            ├── TokenSelector
            ├── PoolSelector
            ├── FeeTierSelector
            ├── RangeSelector
            │   ├── PriceRangeInput
            │   └── RangeVisualizer
            ├── AmountInput (Token0, Token1)
            ├── PreviewPosition
            └── ConfirmButton
```

### 2.2 Data Flow Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────►│  API Client  │─────►│   Backend   │
│ Components  │◄─────│  (Axios)     │◄─────│    API      │
└──────┬──────┘      └──────────────┘      └─────────────┘
       │
       │               ┌──────────────┐
       │               │  TanStack    │
       └──────────────►│   React      │
                       │   Query      │
                       │ (Caching)    │
                       └──────────────┘

┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   wagmi     │─────►│   ethers.js  │─────►│   BSC RPC   │
│ (Wallet)    │◄─────│ (Contracts)  │◄─────│ (Node)      │
└─────────────┘      └──────────────┘      └─────────────┘
```

### 2.3 State Management Layers

| Layer | Tool | Purpose |
|-------|------|---------|
| **Server State** | TanStack React Query | API responses, auto-refetch, caching |
| **Client State** | Zustand | UI preferences, modals, local state |
| **Wallet State** | wagmi | Connected address, chain, balance |
| **Form State** | React Hook Form | Liquidity forms, validation |

### 2.4 Key Files & Responsibilities

#### Core Files
- `layout.tsx` - Root layout, injects Web3 providers
- `page.tsx` - Dashboard entry point
- `providers.tsx` - Wagmi + QueryClient setup

#### Components
- `WalletConnect.tsx` - Wallet connection UI
- `dashboard.tsx` - Main dashboard layout
- `pool/PoolList.tsx` - Pool listing с фильтрами
- `position/PositionList.tsx` - User positions
- `token/TokenSelector.tsx` - Token search & selection
- `quick-actions/QuickSellToUSDT.tsx` - One-click exit button

#### API Integration
- `lib/api.ts` - Axios API client с endpoints
- `utils/constants.ts` - Contract addresses, fee tiers, popular tokens

### 2.5 Routing Structure

```
/                     → Dashboard (default: pools tab)
/pools                → All pools view
/pools/[address]      → Pool details
/positions            → User positions
/positions/[tokenId]  → Position details
/add-liquidity        → Add liquidity wizard
/settings             → App settings (slippage, RPC)
```

---

## 3. Backend Architecture (Express.js)

### 3.1 Layered Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Express Server                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────┐    ┌────────────┐    ┌───────────┐    │
│  │ Routes   │───►│ Controllers│───►│ Services  │    │
│  │ (HTTP)   │    │ (Request)  │    │ (Business)│    │
│  └──────────┘    └────────────┘    └─────┬─────┘    │
│                                          │           │
│                        ┌─────────────────┼───────┐   │
│                        ▼                 ▼       │   │
│                  ┌──────────┐    ┌───────────┐   │   │
│                  │ TypeORM  │    │  Web3     │   │   │
│                  │ (DB)     │    │ Service   │   │   │
│                  └──────────┘    └─────┬─────┘   │   │
│                                        │         │   │
│                              ┌─────────┴─────┐   │   │
│                              ▼               ▼   │   │
│                        ┌──────────┐   ┌────────┐ │   │
│                        │PostgreSQL│   │  BSC   │ │   │
│                        │  Redis   │   │  Node  │ │   │
│                        └──────────┘   └────────┘ │   │
└──────────────────────────────────────────────────────┘
```

### 3.2 Module Structure

```
backend/src/
├── index.ts                 # Entry point, middleware setup
├── config/
│   └── env.ts              # Environment configuration
├── routes/                  # HTTP routes (URL mapping)
│   ├── pools.ts
│   ├── tokens.ts
│   ├── positions.ts
│   └── transactions.ts
├── controllers/             # Request handlers (validation → service)
│   ├── poolController.ts
│   ├── tokenController.ts
│   ├── positionController.ts
│   └── transactionController.ts
├── services/                # Business logic
│   ├── poolService.ts
│   ├── tokenService.ts
│   ├── positionService.ts
│   ├── transactionService.ts
│   ├── priceService.ts
│   └── web3Service.ts
├── entities/                # TypeORM database models
│   ├── Pool.ts
│   ├── Token.ts
│   ├── Position.ts
│   └── Transaction.ts
├── types/                   # TypeScript interfaces
│   └── index.ts
└── utils/
    └── logger.ts           # Winston logging
```

### 3.3 Service Dependencies

```
web3Service.ts (Base)
    ├── poolService.ts (uses web3Service)
    ├── tokenService.ts (uses web3Service)
    ├── positionService.ts (uses web3Service)
    ├── transactionService.ts (uses web3Service, positionService)
    └── priceService.ts (uses web3Service, Redis cache)
```

### 3.4 Request Lifecycle

```
HTTP Request
    ↓
[Middleware] CORS, JSON parsing
    ↓
[Route] URL matching
    ↓
[Controller] Request validation (Zod)
    ↓
[Service] Business logic
    ↓
    ├─→ Web3 Service → BSC RPC
    ├─→ Database → PostgreSQL
    └─→ Cache → Redis
    ↓
[Controller] Format response
    ↓
HTTP Response
    ↓
[Logger] Log request/response
```

---

## 4. Data Architecture

### 4.1 Database Schema (PostgreSQL)

```sql
-- Token Table
CREATE TABLE token (
    address VARCHAR(42) PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    decimals INTEGER NOT NULL,
    logo_uri VARCHAR(255),
    price_usd DECIMAL(20,8),
    total_liquidity DECIMAL(30,8),
    volume_24h DECIMAL(30,8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pool Table
CREATE TABLE pool (
    address VARCHAR(42) PRIMARY KEY,
    token0_address VARCHAR(42) REFERENCES token(address),
    token1_address VARCHAR(42) REFERENCES token(address),
    fee INTEGER NOT NULL,
    tick_spacing INTEGER NOT NULL,
    sqrt_price_x96 VARCHAR(78),
    tick INTEGER,
    liquidity VARCHAR(40),
    tvl_usd DECIMAL(20,8),
    volume_24h DECIMAL(30,8),
    fee_24h DECIMAL(30,8),
    apr DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_token0 (token0_address),
    INDEX idx_token1 (token1_address),
    INDEX idx_tvl (tvl_usd),
    INDEX idx_apr (apr)
);

-- Position Table
CREATE TABLE position (
    id VARCHAR(255) PRIMARY KEY,
    token_id VARCHAR(78) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    pool_address VARCHAR(42) REFERENCES pool(address),
    tick_lower INTEGER NOT NULL,
    tick_upper INTEGER NOT NULL,
    liquidity VARCHAR(40),
    amount0 DECIMAL(30,8),
    amount1 DECIMAL(30,8),
    unclaimed_fees0 DECIMAL(30,8),
    unclaimed_fees1 DECIMAL(30,8),
    in_range BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_owner (owner_address),
    INDEX idx_pool (pool_address),
    INDEX idx_range (in_range)
);

-- Transaction Table
CREATE TABLE transaction (
    hash VARCHAR(66) PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'add', 'remove', 'swap'
    status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed'
    pool_address VARCHAR(42) REFERENCES pool(address),
    token_id VARCHAR(78),
    amount_in DECIMAL(30,8),
    amount_out DECIMAL(30,8),
    gas_used DECIMAL(20,2),
    timestamp TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user (user_address),
    INDEX idx_status (status),
    INDEX idx_timestamp (timestamp)
);
```

### 4.2 Redis Cache Architecture

```
Redis Structure:
├── pool:list:{filters}          → JSON array of pools (TTL: 60s)
├── pool:details:{address}       → JSON pool details (TTL: 30s)
├── token:price:{address}        → JSON price data (TTL: 30s)
├── position:user:{wallet}       → JSON positions (TTL: 60s)
└── apr:calculation:{pool}       → JSON APR data (TTL: 300s)

Cache Strategy:
1. Check Redis → if hit, return immediately
2. If miss → query blockchain/DB → cache → return
3. Background jobs refresh cache periodically
```

---

## 5. Smart Contract Integration Architecture

### 5.1 Contract Interaction Flow

```
Frontend Component
    ↓
[Build Request] POST /api/positions/add
    ↓
Backend Position Service
    ↓
[Web3 Service] Reads contract ABI
    ↓
[Contract Call] positionManager.mint.populateTransaction()
    ↓
[Return] Transaction data {to, data, value}
    ↓
Frontend receives tx data
    ↓
[wagmi] wallet.sendTransaction(tx)
    ↓
User signs in MetaMask
    ↓
Transaction broadcast to BSC
    ↓
Backend monitors tx status
```

### 5.2 Contract Call Patterns

**Read Operations (Direct to RPC):**
```typescript
// Pool data
pool.slot0()
pool.liquidity()
pool.token0()
pool.token1()

// User data
positionManager.balanceOf(wallet)
positionManager.positions(tokenId)
```

**Write Operations (User Signs):**
```typescript
// Add liquidity
positionManager.mint(params)

// Remove liquidity
positionManager.decreaseLiquidity(params)
positionManager.collect(params)

// Swap
router.exactInputSingle(params)
```

### 5.3 Multi-Contract Transaction Flow (Quick Exit)

```
User clicks "Quick Exit to USDT"
    ↓
Backend builds 4 transactions:
    1. decreaseLiquidity(tokenId, liquidity)
    2. collect(tokenId) → claim token0 & token1
    3. exactInputSingle(token0 → USDT)
    4. exactInputSingle(token1 → USDT)
    ↓
Frontend executes sequentially:
    await tx1.wait()
    await tx2.wait()
    await tx3.wait()
    await tx4.wait()
    ↓
USDT received in wallet
```

---

## 6. Background Jobs Architecture

### 6.1 Pool Scanner (Every 5 minutes)

```
┌──────────────┐
│ Cron Trigger │
└──────┬───────┘
       ↓
┌──────────────────────────────────┐
│ Scan Factory Events              │
│ - PoolCreated(last 10k blocks)   │
└──────┬───────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ For Each New Pool:               │
│ - Fetch pool data                │
│ - Fetch token info               │
│ - Calculate initial metrics      │
│ - Save to database               │
└──────┬───────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Update Existing Pools:           │
│ - TVL, Volume, APR               │
│ - Token prices                   │
└──────┬───────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Invalidate Redis Cache           │
└──────────────────────────────────┘
```

### 6.2 Position Monitor (Every 1 minute)

```
┌──────────────┐
│ Cron Trigger │
└──────┬───────┘
       ↓
┌──────────────────────────────────┐
│ For Each Active Position:        │
│ - Check current tick             │
│ - Determine in/out of range      │
│ - Update unclaimed fees          │
└──────┬───────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ If position went out of range:   │
│ - Update database                │
│ - Trigger notification (future)  │
└──────────────────────────────────┘
```

---

## 7. Security Architecture

### 7.1 Threat Model

| Threat | Mitigation |
|--------|-----------|
| Private key theft | Never stored, only MetaMask/WalletConnect |
| Transaction replay | Deadline parameter on all txs |
| Slippage attacks | Min output amounts enforced |
| API abuse | Rate limiting (future), input validation |
| SQL injection | TypeORM parameterized queries |
| XSS | Next.js CSP headers, sanitized inputs |

### 7.2 Permission Model

```
User Wallet (MetaMask)
    ├── Can: Read all public data
    ├── Can: Build transactions
    ├── Can: Sign transactions
    └── Cannot: Backend sign on behalf of user
    
Backend Server
    ├── Can: Read blockchain data
    ├── Can: Build transaction data
    ├── Can: Cache data in Redis
    └── Cannot: Sign transactions
    └── Cannot: Access user funds
```

---

## 8. Deployment Architecture

### 8.1 Production Setup

```
┌──────────────────────────────────────────────────┐
│                  Frontend (Vercel)                │
│  CDN → Edge Network → Next.js Static/SSR         │
└────────────────────────┬─────────────────────────┘
                         │ HTTPS
                         ↓
┌──────────────────────────────────────────────────┐
│               Backend (Railway)                   │
│  Load Balancer → Express Instances (x2+)         │
└────────┬──────────────┬──────────────┬───────────┘
         │              │              │
         ↓              ↓              ↓
    ┌────────┐   ┌──────────┐   ┌─────────┐
    │PostgreSQL│  │  Redis   │   │ BSC RPC │
    │Supabase  │  │  Upstash │   │  Node   │
    └────────┘   └──────────┘   └─────────┘
```

### 8.2 Environment Separation

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:3000/3001 |
| Staging | Testing | staging.liquidity-manager.com |
| Production | Live | app.liquidity-manager.com |

---

## 9. Monitoring & Observability

### 9.1 Logging Strategy

```
Frontend:
├── Console logs (dev only)
└── Error tracking → Sentry (future)

Backend:
├── Winston Logger
├── Application logs → logs/combined.log
├── Error logs → logs/error.log
└── Structured JSON format
```

### 9.2 Key Metrics to Track

- API response times (p50, p95, p99)
- Database query times
- Redis hit/miss ratio
- Blockchain RPC errors
- Transaction success rate
- User active sessions

---

## 10. Future Architecture Extensions

### 10.1 V4 Integration (Hooks)

```
Current V3 Architecture:
positionManager.mint() → NFT position

Future V4 Architecture:
positionManager.modifyLiquidities() → Hook calls
    ├── Custom logic hooks
    ├── Dynamic fees
    ├── Limit orders
    └── Auto-compounding
```

### 10.2 Multi-chain Architecture

```
Current: Single chain (BSC)
    ↓
Future: Multi-chain
├── ChainRegistry Service
├── Per-chain RPC providers
├── Per-chain subgraphs
├── Cross-chain position aggregation
└── Bridge integration
```

---

## 11. Technology Decisions Rationale

| Decision | Choice | Reason |
|----------|--------|--------|
| Next.js App Router | ✅ | Server components, better SEO, modern |
| ethers.js v6 | ✅ | Better TypeScript, modern API |
| wagmi | ✅ | React hooks for Web3, wallet management |
| PostgreSQL | ✅ | Relational data, complex queries |
| Redis | ✅ | Fast cache, simple key-value |
| Express | ✅ | Simple, well-understood, good for REST |
| TypeORM | ✅ | TypeScript-first, active record pattern |
| TailwindCSS | ✅ | Rapid development, consistent design |

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-10  
**Maintained By**: Liquidity Manager Team
