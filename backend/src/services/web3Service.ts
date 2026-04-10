import { ethers, Contract } from 'ethers';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import PancakeV3FactoryABI from '../../contracts/abis/PancakeV3Factory.json';
import PancakeV3PoolABI from '../../contracts/abis/PancakeV3Pool.json';
import PancakeV3PositionManagerABI from '../../contracts/abis/PancakeV3PositionManager.json';

export class Web3Service {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.bscRpcUrl);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getFactoryContract(): Contract {
    return new Contract(
      config.pancakeV3Factory,
      PancakeV3FactoryABI.abi,
      this.provider
    );
  }

  getPoolContract(poolAddress: string): Contract {
    return new Contract(poolAddress, PancakeV3PoolABI.abi, this.provider);
  }

  getPositionManagerContract(): Contract {
    return new Contract(
      config.pancakeV3Factory,
      PancakeV3PositionManagerABI.abi,
      this.provider
    );
  }

  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    const tokenABI = ['function balanceOf(address) view returns (uint256)'];
    const token = new Contract(tokenAddress, tokenABI, this.provider);
    return await token.balanceOf(walletAddress);
  }

  async getTokenInfo(tokenAddress: string): Promise<{
    symbol: string;
    name: string;
    decimals: number;
  }> {
    const tokenABI = [
      'function symbol() view returns (string)',
      'function name() view returns (string)',
      'function decimals() view returns (uint8)',
    ];
    const token = new Contract(tokenAddress, tokenABI, this.provider);
    
    const [symbol, name, decimals] = await Promise.all([
      token.symbol(),
      token.name(),
      token.decimals(),
    ]);

    return { symbol, name, decimals };
  }

  async getGasPrice(): Promise<bigint> {
    return await this.provider.getGasPrice();
  }

  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return await this.provider.estimateGas(tx);
  }
}

export const web3Service = new Web3Service();
