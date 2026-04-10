import { Pool } from 'typeorm';
import { Redis } from 'redis';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Blockchain
  bscRpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
  bscWsUrl: process.env.BSC_WS_URL || 'wss://bsc-ws-node.nariox.org:443',
  
  // Database
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbUsername: process.env.DB_USERNAME || 'postgres',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'liquidity_manager',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // PancakeSwap V3/V4 Factory Addresses
  pancakeV3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
  pancakeV4Factory: '0x0000000000000000000000000000000000000000', // Update when available
  
  // Uniswap V3 Factory (if needed)
  uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  
  // USDT Address on BSC
  usdtAddress: '0x55d398326f99059fF775485246999027B3197955',
  
  // WBNB Address
  wbnbAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  
  // Subgraph URLs
  pancakeV3Subgraph: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
};

export const dbConfig = {
  type: 'postgres',
  host: config.dbHost,
  port: config.dbPort,
  username: config.dbUsername,
  password: config.dbPassword,
  database: config.dbName,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: [__dirname + '/../entities/*.ts'],
};
