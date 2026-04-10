// PancakeSwap V3/V4 Contract Addresses on BSC
export const CONTRACTS = {
  V3: {
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    positionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    quoter: '0xB04AB998Ae2b4a033B33D20ea8cF80B9Fe0bB189',
  },
  V4: {
    factory: '0x0000000000000000000000000000000000000000', // Update when deployed
    positionManager: '0x0000000000000000000000000000000000000000', // Update when deployed
    router: '0x0000000000000000000000000000000000000000', // Update when deployed
  },
  // Token Addresses
  tokens: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  },
  // Fee tiers for V3/V4
  feeTiers: [100, 500, 2500, 10000], // 0.01%, 0.05%, 0.25%, 1%
} as const;

// Tick Spacing based on fee tier
export const TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  2500: 50,
  10000: 200,
};
