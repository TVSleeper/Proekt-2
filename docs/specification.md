# Liquidity Manager - Complete Specification

## 1. Product Overview

### 1.1 Product Vision
**Liquidity Manager** - веб-приложение для управления концентрированной ликвидностью на PancakeSwap V3/V4 в сети BSC. Приложение позволяет пользователям находить пулы, добавлять ликвидность с заданным ценовым диапазоном, отслеживать позиции и мгновенно выходить из позиций с автоматическим обменом всех токенов в USDT.

### 1.2 Target Audience
- **Primary**: DeFi пользователи с опытом работы в DEX
- **Secondary**: Продвинутые трейдеры, ищущие оптимизацию ликвидности
- **Experience Level**: Intermediate to Advanced

### 1.3 Core Value Propositions
1. **Unified Interface**: Все пулы PancakeSwap V3/V4 в одном месте
2. **Quick Exit**: Мгновенный выход из позиции с авто-свапом в USDT
3. **Token Discovery**: Поиск токенов по адресу контракта с автоматической валидацией
4. **Concentrated Liquidity**: Точный контроль ценового диапазона
5. **Real-time Analytics**: APR, TVL, объем, комиссии в реальном времени

---

## 2. Functional Requirements

### FR-1: Wallet Connection

#### FR-1.1: Connect Wallet
**As a** user  
**I want to** connect my MetaMask or WalletConnect wallet  
**So that** I can interact with the application  

**Acceptance Criteria:**
- [ ] User can click "Connect Wallet" button
- [ ] Modal displays with wallet options (MetaMask, WalletConnect)
- [ ] After connection, wallet address displays in header (e.g., `0x1234...5678`)
- [ ] Connected chain displays (BSC Mainnet)
- [ ] If wrong network, prompt user to switch to BSC
- [ ] Disconnect button available

**Technical Notes:**
- Use wagmi `useConnect` hook
- Supported wallets: MetaMask, WalletConnect v2
- Chain ID: 56 (BSC Mainnet)

#### FR-1.2: Network Detection
**As a** user  
**I want to** be notified if I'm on the wrong network  
**So that** I don't make mistakes  

**Acceptance Criteria:**
- [ ] Detect current network
- [ ] If not BSC, show warning modal
- [ ] Offer "Switch to BSC" button
- [ ] Block transactions until correct network

---

### FR-2: Token Management

#### FR-2.1: Search Token by Contract Address
**As a** user  
**I want to** enter a token contract address  
**So that** I can find and interact with that token  

**Acceptance Criteria:**
- [ ] Input field accepts contract address (0x...)
- [ ] On submit, validate address format (42 chars, 0x prefix)
- [ ] Fetch token metadata from blockchain (symbol, name, decimals)
- [ ] Display token info: symbol, name, price (if available)
- [ ] If invalid address, show error: "Invalid token address"
- [ ] If contract not a token, show error: "Not a valid token contract"

**Technical Notes:**
- Call `token.symbol()`, `token.name()`, `token.decimals()` on-chain
- Validate with regex: `/^0x[a-fA-F0-9]{40}$/`

#### FR-2.2: Import Custom Token
**As a** user  
**I want to** import a token not in the popular list  
**So that** I can access all tokens  

**Acceptance Criteria:**
- [ ] "Import Token" button in token selector
- [ ] Opens modal with address input
- [ ] After validation, add to user's token list
- [ ] Show warning for unverified tokens
- [ ] Store imported tokens in localStorage

#### FR-2.3: View Popular Tokens
**As a** user  
**I want to** see a list of popular tokens  
**So that** I can quickly select common tokens  

**Acceptance Criteria:**
- [ ] Display predefined list: USDT, USDC, WBNB, CAKE, ETH, BTCB
- [ ] Show token symbol, name, and logo
- [ ] Click selects token and filters pools

---

### FR-3: Pool Discovery & Browsing

#### FR-3.1: View All Available Pools
**As a** user  
**I want to** see all liquidity pools for a token  
**So that** I can choose where to add liquidity  

**Acceptance Criteria:**
- [ ] After selecting token, display all pools involving that token
- [ ] Each pool shows:
  - Token pair (e.g., USDT/WBNB)
  - Fee tier (0.01%, 0.05%, 0.25%, 1%)
  - Current price
  - TVL (Total Value Locked)
  - 24h Volume
  - APR (Annual Percentage Rate)
  - Liquidity amount
- [ ] Pools sorted by TVL (default)
- [ ] Pagination for large lists (50 pools per page)

**Technical Notes:**
- Query backend: `GET /api/pools?token={address}`
- Backend scans Factory contract and database
- APR calculated: `(fees_24h * 365) / TVL * 100`

#### FR-3.2: Filter & Sort Pools
**As a** user  
**I want to** filter and sort pools  
**So that** I can find the best pools  

**Acceptance Criteria:**
- [ ] Filter by:
  - Fee tier (checkboxes: 0.01%, 0.05%, 0.25%, 1%)
  - TVL range (slider: min-max)
  - APR range (slider: min-max)
  - Contains specific token
- [ ] Sort by:
  - TVL (asc/desc)
  - APR (asc/desc)
  - Volume 24h (asc/desc)
  - Fee tier (asc/desc)
- [ ] Filters combine with AND logic
- [ ] Reset filters button

#### FR-3.3: View Pool Details
**As a** user  
**I want to** see detailed information about a pool  
**So that** I can make informed decisions  

**Acceptance Criteria:**
- [ ] Click pool → navigate to `/pools/{address}`
- [ ] Display:
  - Token pair with logos
  - Pool address (copyable)
  - Fee tier & tick spacing
  - Current price & tick
  - Total liquidity
  - TVL, Volume 24h, Fees 24h
  - APR breakdown
  - Liquidity distribution chart (histogram)
  - Recent transactions (optional)

---

### FR-4: Concentrated Liquidity Management

#### FR-4.1: Add Liquidity - Pool Selection
**As a** user  
**I want to** select a pool and fee tier  
**So that** I can add liquidity to that pool  

**Acceptance Criteria:**
- [ ] Navigate to `/add-liquidity`
- [ ] Select token pair (or select from pool list)
- [ ] If multiple fee tiers exist, show selector:
  - 0.01% (tick spacing: 1)
  - 0.05% (tick spacing: 10)
  - 0.25% (tick spacing: 50)
  - 1% (tick spacing: 200)
- [ ] Show fee tier descriptions
- [ ] Display current pool price

#### FR-4.2: Set Price Range
**As a** user  
**I want to** set my liquidity price range  
**So that** I can concentrate my liquidity  

**Acceptance Criteria:**
- [ ] Display current price prominently
- [ ] Two inputs: Min Price, Max Price
- [ ] Visual price range selector with chart
- [ ] Show tick numbers (advanced mode)
- [ ] Validate: min < current price < max (for range)
- [ ] Warning if range is very wide (inefficient capital)
- [ ] Warning if range is very narrow (high risk of going out-of-range)
- [ ] "Full Range" option (like V2)
- [ ] Preset ranges (e.g., ±5%, ±10%, ±20%)

**Validation Rules:**
- Min price must be > 0
- Max price must be > min price
- Tick values must align with fee tier tick spacing

#### FR-4.3: Input Amounts
**As a** user  
**I want to** specify how much liquidity to add  
**So that** I can control my exposure  

**Acceptance Criteria:**
- [ ] Two amount inputs: Token 0 amount, Token 1 amount
- [ ] Auto-calculate optimal ratio based on price range
- [ ] "Max" button for each token (uses wallet balance)
- [ ] Show wallet balance for each token
- [ ] Show USD equivalent
- [ ] If entering one amount, auto-calculate other
- [ ] Show "Deposit Summary":
  - Token 0: X ($Y)
  - Token 1: A ($B)
  - Total value: $Z

#### FR-4.4: Preview Position
**As a** user  
**I want to** preview my position before committing  
**So that** I understand what I'm creating  

**Acceptance Criteria:**
- [ ] Show preview card with:
  - Selected pool & fee tier
  - Price range (min-max)
  - Deposit amounts (token0, token1)
  - Expected liquidity (shares)
  - Current APR estimate
  - Position status: "In Range" or "Out of Range"
  - Slippage tolerance (default 0.5%)
- [ ] Warning messages:
  - "Price is outside your range" if out of range
  - "Very wide range, capital may be inefficient"
  - "Very narrow range, may go out of range soon"

#### FR-4.5: Approve Tokens
**As a** user  
**I want to** approve token spending  
**So that** the contract can use my tokens  

**Acceptance Criteria:**
- [ ] Check token allowances
- [ ] If not approved, show "Approve {Token}" button
- [ ] Approval transaction executes first
- [ ] Show approval status: "Pending" → "Approved"
- [ ] Can approve both tokens in one click if needed

#### FR-4.6: Execute Add Liquidity
**As a** user  
**I want to** confirm and execute the transaction  
**So that** my position is created  

**Acceptance Criteria:**
- [ ] "Add Liquidity" button enabled after approvals
- [ ] On click, send transaction to PositionManager.mint()
- [ ] Show transaction modal:
  - Transaction details
  - Gas estimate
  - Sign in wallet
- [ ] Transaction states:
  - "Waiting for signature"
  - "Submitting transaction..."
  - "Confirming on blockchain..." (show block confirmations)
  - "Success!" or "Failed"
- [ ] On success:
  - Show position details
  - Update position list
  - Record transaction in backend
  - Option: "View on BSCScan"

**Error Handling:**
- Insufficient balance → "Insufficient {token} balance"
- Transaction reverted → "Transaction failed: {reason}"
- Slippage too high → "Price moved too much, try again"
- Out of gas → "Gas estimate too low, increase gas limit"

---

### FR-5: Position Management

#### FR-5.1: View My Positions
**As a** user  
**I want to** see all my active positions  
**So that** I can manage my liquidity  

**Acceptance Criteria:**
- [ ] Navigate to "My Positions" tab
- [ ] Display grid/list of all positions for connected wallet
- [ ] Each position card shows:
  - Pool (token pair + fee tier)
  - Price range (min-max)
  - Current status: 🟢 In Range / 🔴 Out of Range
  - Liquidity amount
  - Unclaimed fees (token0, token1)
  - Position value (USD estimate)
  - APR at time of creation
- [ ] Click position → detailed view
- [ ] Empty state: "No positions yet. Add liquidity to get started."

**Technical Notes:**
- Query PositionManager: `balanceOf(wallet)`
- Loop through token IDs, call `positions(tokenId)`
- Check current pool tick vs position tick range

#### FR-5.2: View Position Details
**As a** user  
**I want to** see detailed information about a position  
**So that** I can monitor its performance  

**Acceptance Criteria:**
- [ ] Navigate to `/positions/{tokenId}`
- [ ] Display:
  - Pool details (pair, fee, address)
  - Price range (min, max, current)
  - Position status (in/out of range)
  - Liquidity amount
  - Amounts (token0, token1)
  - Unclaimed fees
  - Transaction history for this position
  - Visual representation of price range
  - P&L estimate (if possible)
- [ ] Action buttons:
  - "Add More Liquidity"
  - "Remove Liquidity"
  - "Quick Exit to USDT"

#### FR-5.3: Add More Liquidity to Position
**As a** user  
**I want to** increase liquidity in my position  
**So that** I can earn more fees  

**Acceptance Criteria:**
- [ ] "Add More Liquidity" button on position details
- [ ] Opens add liquidity flow with pre-filled range
- [ ] Can increase liquidity amount
- [ ] Cannot change price range (V3 limitation)
- [ ] Executes increaseLiquidity() transaction

---

### FR-6: Remove Liquidity

#### FR-6.1: Remove Partial Liquidity
**As a** user  
**I want to** remove some liquidity from my position  
**So that** I can reduce my exposure  

**Acceptance Criteria:**
- [ ] "Remove Liquidity" button
- [ ] Slider or input: 0-100% of liquidity
- [ ] Preview:
  - Amount to remove
  - Tokens to receive (token0, token1)
  - Remaining liquidity
- [ ] Execute decreaseLiquidity() transaction
- [ ] Auto-collect fees (collect() transaction)
- [ ] Update position details

#### FR-6.2: Remove All Liquidity
**As a** user  
**I want to** completely remove my position  
**So that** I can exit the pool  

**Acceptance Criteria:**
- [ ] "Remove All" option
- [ ] Removes 100% of liquidity
- [ ] Collects all fees
- [ ] Position NFT burned
- [ ] Tokens sent to wallet
- [ ] Remove from position list

---

### FR-7: Quick Exit - Remove & Swap to USDT ⚡

#### FR-7.1: Quick Exit Preview
**As a** user  
**I want to** see what I'll receive before confirming  
**So that** I know the outcome  

**Acceptance Criteria:**
- [ ] "Quick Exit to USDT" button on position/dashboard
- [ ] Click → show preview modal:
  - Position being removed
  - Tokens to receive (before swap)
  - Expected USDT after swap
  - Swap routes (token0 → USDT, token1 → USDT)
  - Estimated slippage
  - Gas estimate (total for all transactions)
  - Minimum USDT output (after slippage tolerance)
  - Total value breakdown
- [ ] Warning: "This action cannot be undone"
- [ ] Slippage tolerance setting (default 0.5%)

#### FR-7.2: Execute Quick Exit
**As a** user  
**I want to** execute the exit with one confirmation  
**So that** I can quickly get USDT  

**Acceptance Criteria:**
- [ ] "Confirm Quick Exit" button
- [ ] Execute multi-step transaction sequence:
  1. **Step 1**: decreaseLiquidity(tokenId, 100%)
     - Wait for confirmation
  2. **Step 2**: collect(tokenId)
     - Wait for confirmation
     - Receives token0 and token1
  3. **Step 3**: exactInputSingle(token0 → USDT)
     - Only if token0 ≠ USDT
     - Wait for confirmation
  4. **Step 4**: exactInputSingle(token1 → USDT)
     - Only if token1 ≠ USDT
     - Wait for confirmation
- [ ] Progress indicator for each step
- [ ] If any step fails:
  - Stop execution
  - Show error
  - Display what was completed
  - Option to continue manual swaps
- [ ] On success:
  - Show summary:
    - USDT received
    - Total gas spent
    - Effective price
  - Update position list (position removed)
  - Record all transactions
  - "View on BSCScan" link

**Technical Flow:**
```javascript
// Transaction sequence
const tx1 = await positionManager.decreaseLiquidity({
  tokenId,
  liquidity: position.liquidity,
  amount0Min: calculated_min0,
  amount1Min: calculated_min1,
  deadline: now + 20 minutes
});
await tx1.wait();

const tx2 = await positionManager.collect({
  tokenId,
  recipient: userAddress,
  amount0Max: MAX,
  amount1Max: MAX
});
await tx2.wait();

if (token0 !== USDT) {
  const tx3 = await router.exactInputSingle({
    tokenIn: token0,
    tokenOut: USDT,
    fee: poolFee,
    recipient: userAddress,
    amountIn: token0Amount,
    amountOutMinimum: minUSDT0,
    deadline: now + 20 minutes
  });
  await tx3.wait();
}

// Repeat for token1 if needed
```

#### FR-7.3: Quick Exit All Positions
**As a** user  
**I want to** exit all my positions at once  
**So that** I can quickly convert everything to USDT  

**Acceptance Criteria:**
- [ ] "Exit All to USDT" button on dashboard
- [ ] Preview shows:
  - All positions to be removed
  - Total USDT expected
  - Total gas estimate
  - Number of transactions
- [ ] Execute sequentially for each position
- [ ] Progress across all positions
- [ ] Summary at end
- [ ] Warning: "This will remove ALL your liquidity positions"

---

### FR-8: Swap Tokens (Standalone)

#### FR-8.1: Swap to USDT
**As a** user  
**I want to** swap any token to USDT  
**So that** I can exit positions manually  

**Acceptance Criteria:**
- [ ] "Swap" tab or modal
- [ ] Select input token
- [ ] Input amount
- [ ] Show expected USDT output
- [ ] Show price impact
- [ ] Show minimum output (after slippage)
- [ ] Execute exactInputSingle() transaction
- [ ] Works for any token with USDT pool

---

### FR-9: Real-time Data & Analytics

#### FR-9.1: Pool Analytics
**As a** user  
**I want to** see real-time pool statistics  
**So that** I can make data-driven decisions  

**Acceptance Criteria:**
- [ ] Auto-refresh pool data every 30 seconds
- [ ] Display:
  - Current price (updates in real-time)
  - TVL changes
  - Volume 24h chart
  - Fee accumulation rate
  - APR calculation
  - Liquidity depth chart

#### FR-9.2: Position Analytics
**As a** user  
**I want to** track my position performance  
**So that** I can optimize my strategy  

**Acceptance Criteria:**
- [ ] Position P&L estimate
- [ ] Fees earned since creation
- [ ] Time in range vs out of range
- [ ] Impermanent loss estimate
- [ ] APR over time chart

#### FR-9.3: Price Alerts (Future)
**As a** user  
**I want to** be alerted when price reaches a level  
**So that** I can manage my positions proactively  

**Acceptance Criteria:**
- [ ] Set price alert for token
- [ ] Notification when price hits target
- [ ] Email or push notification

---

### FR-10: Settings & Configuration

#### FR-10.1: Slippage Tolerance
**As a** user  
**I want to** set my slippage tolerance  
**So that** I can control trade execution  

**Acceptance Criteria:**
- [ ] Settings modal
- [ ] Slippage options:
  - Auto (default)
  - 0.1%
  - 0.5%
  - 1%
  - Custom
- [ ] Warning if slippage > 2%
- [ ] Persist setting in localStorage

#### FR-10.2: Transaction Deadline
**As a** user  
**I want to** set transaction expiration time  
**So that** transactions don't hang  

**Acceptance Criteria:**
- [ ] Default: 20 minutes
- [ ] Options: 10, 20, 30, 60 minutes
- [ ] Apply to all transactions

#### FR-10.3: RPC Configuration (Advanced)
**As a** advanced user  
**I want to** configure RPC endpoints  
**So that** I can use my own node  

**Acceptance Criteria:**
- [ ] Custom RPC URL input
- [ ] Test connection button
- [ ] Fallback RPCs list
- [ ] Reset to default

---

## 3. Non-Functional Requirements

### NFR-1: Performance
- **Page Load**: < 3 seconds on 3G
- **API Response**: < 500ms (p95)
- **Pool Data Refresh**: < 2 seconds
- **Transaction Confirmation**: Show status within 1 block time (~3s on BSC)
- **Redis Cache Hit Rate**: > 80%

### NFR-2: Scalability
- **Concurrent Users**: Support 10,000 active users
- **Database**: Handle 1M+ positions
- **API**: 1000 requests/second
- **Horizontal Scaling**: Backend stateless, can add instances

### NFR-3: Availability
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Database**: Automated backups, point-in-time recovery
- **Frontend**: CDN cached, high availability
- **Graceful Degradation**: If backend down, show cached data with warning

### NFR-4: Security
- **No Private Keys**: Never stored or transmitted
- **HTTPS Only**: All connections encrypted
- **Input Validation**: All inputs sanitized (Zod schemas)
- **SQL Injection Prevention**: TypeORM parameterized queries
- **XSS Prevention**: CSP headers, escaped outputs
- **Rate Limiting**: 100 requests/minute per IP (future)

### NFR-5: Reliability
- **Transaction Retry**: Auto-retry on RPC failure (max 3 attempts)
- **Error Recovery**: Clear error messages with recovery steps
- **Data Consistency**: Database transactions for atomicity
- **Monitoring**: Error tracking, alerting on critical failures

### NFR-6: Usability
- **Mobile Responsive**: Works on phones, tablets, desktops
- **Accessibility**: WCAG 2.1 AA compliance (target)
- **Error Messages**: User-friendly, actionable
- **Loading States**: Skeleton loaders, progress indicators
- **Confirmation Dialogs**: For destructive actions

### NFR-7: Maintainability
- **Code Coverage**: > 70% test coverage (target)
- **Documentation**: All public APIs documented
- **Logging**: Structured logs for debugging
- **Type Safety**: 100% TypeScript, no `any` (target)

---

## 4. API Specification

### 4.1 Pools API

#### GET /api/pools
**Description**: Get all pools with optional filters  
**Query Parameters**:
- `token` (optional): Filter by token address
- `sortBy` (optional): Sort field (`tvl`, `apr`, `volume`, `fee`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `minTVL` (optional): Minimum TVL filter
- `maxTVL` (optional): Maximum TVL filter
- `feeTiers` (optional): Comma-separated fee tiers (e.g., `500,2500`)

**Response**:
```json
{
  "data": [
    {
      "address": "0x...",
      "token0": {
        "address": "0x...",
        "symbol": "USDT",
        "name": "Tether USD",
        "decimals": 18,
        "priceUSD": 1.00
      },
      "token1": {
        "address": "0x...",
        "symbol": "WBNB",
        "name": "Wrapped BNB",
        "decimals": 18,
        "priceUSD": 300.00
      },
      "fee": 500,
      "tickSpacing": 10,
      "sqrtPriceX96": "1234567890",
      "tick": -1234,
      "liquidity": "12345678901234",
      "tvl": 1500000.50,
      "volume24h": 250000.75,
      "fee24h": 125.38,
      "apr": 3.05
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  }
}
```

#### GET /api/pools/by-token/:tokenAddress
**Description**: Get all pools containing a specific token  
**Path Parameters**:
- `tokenAddress`: Token contract address

**Response**: Array of pools (same structure as above)

#### GET /api/pools/:poolAddress
**Description**: Get detailed pool information  
**Path Parameters**:
- `poolAddress`: Pool contract address

**Response**:
```json
{
  "address": "0x...",
  "token0": {...},
  "token1": {...},
  "fee": 500,
  "tickSpacing": 10,
  "sqrtPriceX96": "1234567890",
  "tick": -1234,
  "liquidity": "12345678901234",
  "tvl": 1500000.50,
  "volume24h": 250000.75,
  "fee24h": 125.38,
  "apr": 3.05,
  "priceRange": {
    "min": 0.0033,
    "max": 0.0034
  },
  "transactions24h": 150
}
```

#### GET /api/pools/:poolAddress/liquidity-ranges
**Description**: Get liquidity distribution across price ranges  
**Path Parameters**:
- `poolAddress`: Pool contract address

**Response**:
```json
{
  "ranges": [
    {
      "tickLower": -1000,
      "tickUpper": -900,
      "priceLower": 0.0030,
      "priceUpper": 0.0031,
      "liquidity": "123456789"
    }
  ]
}
```

#### POST /api/pools/scan
**Description**: Trigger pool scanning for new pools  
**Request Body**: None  
**Response**:
```json
{
  "success": true,
  "message": "Pool scan initiated",
  "poolsFound": 5
}
```

---

### 4.2 Tokens API

#### GET /api/tokens
**Description**: Get popular tokens list  
**Query Parameters**:
- `limit` (optional): Number of tokens (default: 20)

**Response**:
```json
[
  {
    "address": "0x...",
    "symbol": "USDT",
    "name": "Tether USD",
    "decimals": 18,
    "logoURI": "https://...",
    "priceUSD": 1.00,
    "totalLiquidity": 50000000,
    "volume24h": 10000000
  }
]
```

#### GET /api/tokens/search/:query
**Description**: Search tokens by symbol, name, or address  
**Path Parameters**:
- `query`: Search string

**Response**: Array of matching tokens

#### GET /api/tokens/:address
**Description**: Get token information  
**Path Parameters**:
- `address`: Token contract address

**Response**: Token object (same structure as above)

#### POST /api/tokens/import
**Description**: Import custom token  
**Request Body**:
```json
{
  "address": "0x..."
}
```

**Response**: Token object or error if invalid

---

### 4.3 Positions API

#### GET /api/positions/user/:walletAddress
**Description**: Get all positions for a wallet  
**Path Parameters**:
- `walletAddress`: User wallet address

**Response**:
```json
[
  {
    "id": "position-uuid",
    "tokenId": "123456",
    "pool": {
      "address": "0x...",
      "token0": {...},
      "token1": {...},
      "fee": 500
    },
    "tickLower": -1000,
    "tickUpper": 1000,
    "liquidity": "123456789",
    "amount0": 1000.50,
    "amount1": 500.25,
    "unclaimedFees0": 0.123,
    "unclaimedFees1": 0.456,
    "inRange": true,
    "createdAt": "2026-04-01T10:00:00Z"
  }
]
```

#### GET /api/positions/:positionId
**Description**: Get position details  
**Path Parameters**:
- `positionId`: Position ID or token ID

**Response**: Position object with extended details

#### POST /api/positions/add
**Description**: Build add liquidity transaction  
**Request Body**:
```json
{
  "token0": "0x...",
  "token1": "0x...",
  "fee": 500,
  "tickLower": -1000,
  "tickUpper": 1000,
  "amount0Desired": "1000000000000000000",
  "amount1Desired": "2000000000000000000",
  "amount0Min": "990000000000000000",
  "amount1Min": "1980000000000000000",
  "recipient": "0x...",
  "deadline": 1712764800
}
```

**Response**:
```json
{
  "to": "0x...",
  "data": "0x...",
  "value": "0",
  "gasEstimate": "500000"
}
```

#### POST /api/positions/remove
**Description**: Build remove liquidity transaction  
**Request Body**:
```json
{
  "tokenId": "123456",
  "liquidity": "1000000000000000000",
  "amount0Min": "990000000000000000",
  "amount1Min": "1980000000000000000",
  "deadline": 1712764800
}
```

**Response**: Transaction data object

#### POST /api/positions/remove-and-swap ⚡
**Description**: Build remove liquidity + swap to USDT transactions  
**Request Body**:
```json
{
  "tokenId": "123456",
  "slippageTolerance": 0.5,
  "recipient": "0x...",
  "deadline": 1712764800
}
```

**Response**:
```json
{
  "transactions": [
    {
      "step": 1,
      "action": "decreaseLiquidity",
      "to": "0x...",
      "data": "0x...",
      "description": "Remove liquidity from position"
    },
    {
      "step": 2,
      "action": "collect",
      "to": "0x...",
      "data": "0x...",
      "description": "Collect tokens"
    },
    {
      "step": 3,
      "action": "swap",
      "to": "0x...",
      "data": "0x...",
      "description": "Swap token0 to USDT",
      "expectedOutput": "500.25"
    },
    {
      "step": 4,
      "action": "swap",
      "to": "0x...",
      "data": "0x...",
      "description": "Swap token1 to USDT",
      "expectedOutput": "250.75"
    }
  ],
  "summary": {
    "totalUSDTExpected": "751.00",
    "totalUSDTMinimum": "747.24",
    "estimatedGas": "1200000"
  }
}
```

---

### 4.4 Transactions API

#### GET /api/transactions/user/:walletAddress
**Description**: Get user's transaction history  
**Path Parameters**:
- `walletAddress`: User wallet address

**Query Parameters**:
- `type` (optional): Filter by type (`add`, `remove`, `swap`)
- `limit` (optional): Number of transactions (default: 50)

**Response**:
```json
[
  {
    "hash": "0x...",
    "userAddress": "0x...",
    "type": "add",
    "status": "success",
    "poolAddress": "0x...",
    "tokenId": "123456",
    "amountIn": 1000.00,
    "amountOut": 0,
    "gasUsed": 0.005,
    "timestamp": "2026-04-10T10:00:00Z"
  }
]
```

#### GET /api/transactions/tx/:hash
**Description**: Get transaction status  
**Path Parameters**:
- `hash`: Transaction hash

**Response**:
```json
{
  "hash": "0x...",
  "status": "success",
  "blockNumber": 12345678,
  "confirmations": 10,
  "gasUsed": 500000,
  "timestamp": "2026-04-10T10:00:00Z"
}
```

#### POST /api/transactions/build-add
**Description**: Build add liquidity transaction (alias)  
**Response**: Transaction data object

#### POST /api/transactions/build-remove
**Description**: Build remove liquidity transaction (alias)  
**Response**: Transaction data object

#### POST /api/transactions/build-swap
**Description**: Build swap transaction to USDT  
**Request Body**:
```json
{
  "tokenIn": "0x...",
  "tokenOut": "0x55d398326f99059fF775485246999027B3197955",
  "fee": 500,
  "amountIn": "1000000000000000000",
  "amountOutMinimum": "990000000000000000",
  "recipient": "0x...",
  "deadline": 1712764800
}
```

**Response**:
```json
{
  "to": "0x...",
  "data": "0x...",
  "expectedOutput": "995.50",
  "minimumOutput": "990.00",
  "priceImpact": "0.05",
  "gasEstimate": "300000"
}
```

---

### 4.5 Error Response Format

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} 
  }
}
```

**Common Error Codes**:
- `INVALID_ADDRESS`: Invalid contract address
- `TOKEN_NOT_FOUND`: Token not found
- `POOL_NOT_FOUND`: Pool not found
- `POSITION_NOT_FOUND`: Position not found
- `INSUFFICIENT_BALANCE`: Insufficient token balance
- `INVALID_RANGE`: Invalid price range
- `SLIPPAGE_TOO_HIGH`: Slippage exceeds tolerance
- `TRANSACTION_FAILED`: Transaction execution failed
- `RPC_ERROR`: Blockchain RPC error
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## 5. Smart Contract Interfaces

### 5.1 PancakeSwap V3 Factory
**Address**: `0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865`

**Key Methods**:
```solidity
function getPool(
    address tokenA,
    address tokenB,
    uint24 fee
) external view returns (address pool);
```

**Key Events**:
```solidity
event PoolCreated(
    address indexed token0,
    address indexed token1,
    uint24 indexed fee,
    int24 tickSpacing,
    address pool
);
```

---

### 5.2 PancakeSwap V3 Pool
**Key Methods**:
```solidity
function slot0() external view returns (
    uint160 sqrtPriceX96,
    int24 tick,
    uint16 observationIndex,
    uint16 observationCardinality,
    uint16 observationCardinalityNext,
    uint8 feeProtocol,
    bool unlocked
);

function liquidity() external view returns (uint128);
function token0() external view returns (address);
function token1() external view returns (address);
function fee() external view returns (uint24);
```

---

### 5.3 NonfungiblePositionManager
**Address**: `0x46A15B0b27311cedF172AB29E4f4766fbE7F4364`

**Key Methods**:
```solidity
function balanceOf(address owner) external view returns (uint256);

function positions(uint256 tokenId) external view returns (
    uint96 nonce,
    address operator,
    address token0,
    address token1,
    uint24 fee,
    int24 tickLower,
    int24 tickUpper,
    uint128 liquidity,
    uint256 feeGrowthInside0LastX128,
    uint256 feeGrowthInside1LastX128,
    uint128 tokensOwed0,
    uint128 tokensOwed1
);

function mint(MintParams calldata params) external payable returns (
    uint256 tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
);

function decreaseLiquidity(DecreaseLiquidityParams calldata params) 
    external payable returns (uint256 amount0, uint256 amount1);

function collect(CollectParams calldata params) 
    external payable returns (uint256 amount0, uint256 amount1);

struct MintParams {
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint256 amount0Desired;
    uint256 amount1Desired;
    uint256 amount0Min;
    uint256 amount1Min;
    address recipient;
    uint256 deadline;
}

struct DecreaseLiquidityParams {
    uint256 tokenId;
    uint128 liquidity;
    uint256 amount0Min;
    uint256 amount1Min;
    uint256 deadline;
}

struct CollectParams {
    uint256 tokenId;
    address recipient;
    uint256 amount0Max;
    uint256 amount1Max;
}
```

---

### 5.4 SwapRouter
**Address**: `0x13f4EA83D0bd40E75C8222255bc855a974568Dd4`

**Key Methods**:
```solidity
function exactInputSingle(ExactInputSingleParams calldata params) 
    external payable returns (uint256 amountOut);

struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}
```

---

## 6. Data Models

### 6.1 TypeScript Interfaces

```typescript
interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: number;
  totalLiquidity?: number;
  volume24h?: number;
}

interface Pool {
  address: string;
  token0: Token;
  token1: Token;
  fee: number; // 100, 500, 2500, 10000
  tickSpacing: number;
  sqrtPriceX96: string;
  tick: number;
  liquidity: string;
  tvl: number;
  volume24h: number;
  fee24h: number;
  apr: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Position {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  hash: string;
  userAddress: string;
  type: 'add' | 'remove' | 'swap';
  status: 'pending' | 'success' | 'failed';
  poolAddress?: string;
  tokenId?: string;
  amountIn: number;
  amountOut: number;
  gasUsed: number;
  timestamp: Date;
}

interface AddLiquidityParams {
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

interface RemoveLiquidityParams {
  tokenId: string;
  liquidity: string;
  amount0Min: string;
  amount1Min: string;
  deadline: number;
}

interface QuickExitParams {
  tokenId: string;
  slippageTolerance: number;
  recipient: string;
  deadline: number;
}

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  amountIn: string;
  amountOutMinimum: string;
  recipient: string;
  deadline: number;
}
```

---

## 7. User Interface Specifications

### 7.1 Color Palette

```css
/* Primary Colors */
--primary: #1D9BF0;        /* Blue - actions, links */
--secondary: #0052FF;      /* Dark blue - accents */
--accent: #F0B90B;         /* Gold - branding, highlights */

/* Semantic Colors */
--success: #0ECB81;        /* Green - positive, in range */
--danger: #F6465D;         /* Red - negative, exit, out of range */
--warning: #F0B90B;        /* Yellow - warnings */

/* Background Colors */
--dark: #0B0E11;           /* Main background */
--darker: #181A20;         /* Card backgrounds */
--darkest: #1E2329;        /* Input backgrounds */

/* Text Colors */
--text-primary: #EAECEF;   /* Main text */
--text-secondary: #848E9C; /* Secondary text */
--text-muted: #5E6673;     /* Muted text */
```

### 7.2 Typography

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 7.3 Spacing Scale

```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
```

### 7.4 Component Specifications

#### Buttons
```
Primary Button:
- Background: var(--primary)
- Text: White
- Border-radius: 8px
- Padding: 12px 24px
- Hover: Brightness 1.1
- Disabled: Opacity 0.5

Danger Button:
- Background: var(--danger)
- Used for: Exit, Remove liquidity

Outline Button:
- Border: 1px solid var(--text-muted)
- Background: Transparent
- Used for: Secondary actions
```

#### Cards
```
Pool Card:
- Background: var(--darker)
- Border-radius: 12px
- Padding: 20px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.3)
- Hover: Border highlight

Position Card:
- Same as pool card
- Status indicator (green/red dot)
- Action buttons at bottom
```

#### Forms
```
Input Fields:
- Background: var(--darkest)
- Border: 1px solid var(--text-muted)
- Border-radius: 8px
- Padding: 12px 16px
- Focus: Border color var(--primary)
- Error: Border color var(--danger)

Labels:
- Font size: 14px
- Color: var(--text-secondary)
- Margin bottom: 8px
```

#### Modals
```
- Overlay: Black with 50% opacity
- Background: var(--darker)
- Border-radius: 16px
- Max width: 500px
- Padding: 24px
- Close button: Top right
- Backdrop click to close: Yes
```

---

## 8. Testing Strategy

### 8.1 Unit Tests
- **Frontend**: Jest + React Testing Library
  - Component rendering
  - User interactions
  - Hook logic
  - Utility functions

- **Backend**: Jest
  - Service methods
  - Controllers
  - Validation
  - Web3 interactions

### 8.2 Integration Tests
- API endpoint testing
- Database operations
- Contract interactions (testnet)

### 8.3 E2E Tests
- Playwright/Cypress
- User flows:
  - Connect wallet
  - Add liquidity
  - Remove liquidity
  - Quick exit to USDT

### 8.4 Test Coverage Targets
- Frontend: > 70%
- Backend: > 80%
- Critical paths: 100%

---

## 9. Deployment Checklist

### 9.1 Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis instance ready
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] WalletConnect project ID obtained

### 9.2 Frontend (Vercel)
- [ ] Build succeeds without errors
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] CDN cache configured
- [ ] Error monitoring (Sentry)

### 9.3 Backend (Railway/Render)
- [ ] Build succeeds
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] RPC endpoint working
- [ ] Health check responding
- [ ] CORS configured for frontend domain
- [ ] Rate limiting configured

### 9.4 Security
- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] CSP headers set
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

### 9.5 Monitoring
- [ ] Logging configured
- [ ] Error alerts set up
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Database backups scheduled

---

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| RPC rate limiting | High | Medium | Multiple RPC providers, caching |
| Smart contract bugs | Low | Critical | Use audited contracts only |
| Database downtime | Low | High | Managed DB with backups |
| Frontend outage | Low | Medium | CDN cached, can work offline |
| API abuse | Medium | Medium | Rate limiting, monitoring |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| PancakeSwap contract changes | Low | High | Monitor announcements, quick updates |
| Regulatory changes | Medium | High | Stay compliant, legal review |
| Low adoption | Medium | Medium | Marketing, user education |
| Competitor features | Medium | Low | Continuous development |

---

## 11. Future Enhancements (Roadmap)

### Phase 2 (Months 2-3)
- [ ] PancakeSwap V4 support
- [ ] Auto-compounding positions
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive improvements
- [ ] Email notifications

### Phase 3 (Months 4-6)
- [ ] Multi-chain support (Ethereum, Arbitrum, Polygon)
- [ ] Limit orders (V4 hooks)
- [ ] Portfolio analytics
- [ ] Tax reporting export
- [ ] Mobile app (React Native)

### Phase 4 (Months 6-12)
- [ ] AI-powered range suggestions
- [ ] Impermanent loss insurance
- [ ] Social features (follow top LPs)
- [ ] Governance integration
- [ ] Institutional features

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **DEX** | Decentralized Exchange |
| **LP** | Liquidity Provider |
| **TVL** | Total Value Locked |
| **APR** | Annual Percentage Rate |
| **Impermanent Loss** | Loss from providing liquidity vs holding |
| **Tick** | Price unit in V3/V4 (logarithmic scale) |
| **Tick Spacing** | Minimum distance between ticks (depends on fee tier) |
| **Concentrated Liquidity** | Liquidity in specific price range |
| **Position NFT** | ERC-721 token representing liquidity position |
| **Slippage** | Price difference between quote and execution |
| **sqrtPriceX96** | Square root of price, encoded in Q64.96 format |

---

## 13. References

- **PancakeSwap V3 Docs**: https://docs.pancakeswap.finance/products/pancakeswap-v3
- **Uniswap V3 Whitepaper**: https://uniswap.org/whitepaper-v3.pdf
- **BSC Documentation**: https://docs.bnbchain.org/
- **The Graph**: https://thegraph.com/
- **wagmi Documentation**: https://wagmi.sh/
- **ethers.js Documentation**: https://docs.ethers.org/v6/

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-04-10  
**Author**: Liquidity Manager Team  
**Status**: Approved for Development
