import { CONTRACTS } from '../../../contracts/types/addresses';

export type FeeTier = 100 | 500 | 2500 | 10000;

export const FEE_TIER_LABELS: Record<FeeTier, string> = {
  100: '0.01%',
  500: '0.05%',
  2500: '0.25%',
  10000: '1%',
};

export const FEE_TIER_DESCRIPTIONS: Record<FeeTier, string> = {
  100: 'Best for very stable pairs (e.g., USDT/USDC)',
  500: 'Good for stable pairs (e.g., BTC/ETH)',
  2500: 'Standard for most pairs',
  10000: 'For exotic/volatile pairs',
};

export const POPULAR_TOKENS = [
  {
    address: CONTRACTS.tokens.USDT,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
  },
  {
    address: CONTRACTS.tokens.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
  },
  {
    address: CONTRACTS.tokens.WBNB,
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
  },
  {
    address: CONTRACTS.tokens.CAKE,
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    decimals: 18,
  },
  {
    address: CONTRACTS.tokens.ETH,
    symbol: 'ETH',
    name: 'Ethereum Token',
    decimals: 18,
  },
  {
    address: CONTRACTS.tokens.BTCB,
    symbol: 'BTCB',
    name: 'Bitcoin BEP2',
    decimals: 18,
  },
];

export const SLIPPAGE_TOLERANCE = 0.5; // 0.5%
export const TRANSACTION_DEADLINE = 60 * 20; // 20 minutes

export const RPC_URLS = {
  BSC: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
  ],
};
