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

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: number;
}

export interface Position {
  tokenId: string;
  pool: Pool;
  owner: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  feeGrowthInside0LastX128: string;
  feeGrowthInside1LastX128: string;
  tokensOwed0: string;
  tokensOwed1: string;
  amount0: number;
  amount1: number;
  unclaimedFees0: number;
  unclaimedFees1: number;
  inRange: boolean;
}

export interface LiquidityRange {
  tickLower: number;
  tickUpper: number;
  priceLower: number;
  priceUpper: number;
  liquidity: string;
}

export interface TransactionParams {
  to: string;
  data: string;
  value?: string;
  from: string;
  gasLimit?: string;
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

export interface SwapToUSDTParams {
  tokenAddress: string;
  amountIn: string;
  amountOutMinimum: string;
  recipient: string;
  deadline: number;
}
