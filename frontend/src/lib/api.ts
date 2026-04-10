import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Pools API
export const poolsApi = {
  getAll: (params?: { token?: string; sortBy?: string }) => 
    api.get('/api/pools', { params }),
  
  getByToken: (tokenAddress: string) => 
    api.get(`/api/pools/by-token/${tokenAddress}`),
  
  getDetails: (poolAddress: string) => 
    api.get(`/api/pools/${poolAddress}`),
  
  getLiquidityRanges: (poolAddress: string) => 
    api.get(`/api/pools/${poolAddress}/liquidity-ranges`),
};

// Tokens API
export const tokensApi = {
  getPopular: () => 
    api.get('/api/tokens'),
  
  search: (query: string) => 
    api.get(`/api/tokens/search/${query}`),
  
  getInfo: (address: string) => 
    api.get(`/api/tokens/${address}`),
  
  importToken: (address: string) => 
    api.post('/api/tokens/import', { address }),
};

// Positions API
export const positionsApi = {
  getUserPositions: (walletAddress: string) => 
    api.get(`/api/positions/user/${walletAddress}`),
  
  getPositionDetails: (positionId: string) => 
    api.get(`/api/positions/${positionId}`),
  
  addLiquidity: (params: any) => 
    api.post('/api/positions/add', params),
  
  removeLiquidity: (params: any) => 
    api.post('/api/positions/remove', params),
  
  removeAndSwapToUSDT: (params: any) => 
    api.post('/api/positions/remove-and-swap', params),
};

// Transactions API
export const transactionsApi = {
  getUserTransactions: (walletAddress: string) => 
    api.get(`/api/transactions/user/${walletAddress}`),
  
  getTransactionStatus: (hash: string) => 
    api.get(`/api/transactions/tx/${hash}`),
  
  buildAddLiquidityTx: (params: any) => 
    api.post('/api/transactions/build-add', params),
  
  buildRemoveLiquidityTx: (params: any) => 
    api.post('/api/transactions/build-remove', params),
  
  buildSwapToUSDTTx: (params: any) => 
    api.post('/api/transactions/build-swap', params),
};
