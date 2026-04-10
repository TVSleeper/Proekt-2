import { Position, AddLiquidityParams, RemoveLiquidityParams } from '../types';
import { web3Service } from './web3Service';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { ethers } from 'ethers';

export class PositionService {
  async getUserPositions(walletAddress: string): Promise<Position[]> {
    logger.info('Getting user positions:', walletAddress);
    
    const positionManager = web3Service.getPositionManagerContract();
    
    // Get balance of position NFTs
    const balance = await positionManager.balanceOf(walletAddress);
    
    const positions: Position[] = [];
    
    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await positionManager.tokenOfOwnerByIndex(walletAddress, i);
      const position = await positionManager.positions(tokenId);
      
      positions.push({
        tokenId: tokenId.toString(),
        pool: { address: '' },
        owner: walletAddress,
        tickLower: Number(position.tickLower),
        tickUpper: Number(position.tickUpper),
        liquidity: position.liquidity.toString(),
        feeGrowthInside0LastX128: position.feeGrowthInside0LastX128.toString(),
        feeGrowthInside1LastX128: position.feeGrowthInside1LastX128.toString(),
        tokensOwed0: position.tokensOwed0.toString(),
        tokensOwed1: position.tokensOwed1.toString(),
        amount0: 0,
        amount1: 0,
        unclaimedFees0: 0,
        unclaimedFees1: 0,
        inRange: false,
      });
    }
    
    return positions;
  }

  async getPositionDetails(positionId: string): Promise<Position | null> {
    logger.info('Getting position details:', positionId);
    
    const positionManager = web3Service.getPositionManagerContract();
    const position = await positionManager.positions(positionId);
    
    // Get current tick from pool to determine if in range
    // Calculate amounts
    
    return null;
  }

  async buildAddLiquidityTransaction(params: AddLiquidityParams): Promise<any> {
    logger.info('Building add liquidity transaction:', params);
    
    const positionManager = web3Service.getPositionManagerContract();
    
    const mintParams = {
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
    };

    const tx = await positionManager.mint.populateTransaction(mintParams);
    
    return {
      to: tx.to,
      data: tx.data,
      value: '0',
    };
  }

  async buildRemoveLiquidityTransaction(params: RemoveLiquidityParams): Promise<any> {
    logger.info('Building remove liquidity transaction:', params);
    
    const positionManager = web3Service.getPositionManagerContract();
    
    const decreaseParams = {
      tokenId: params.tokenId,
      liquidity: params.liquidity,
      amount0Min: params.amount0Min,
      amount1Min: params.amount1Min,
      deadline: params.deadline,
    };

    const tx = await positionManager.decreaseLiquidity.populateTransaction(decreaseParams);
    const collectTx = await positionManager.collect.populateTransaction({
      tokenId: params.tokenId,
      recipient: params.recipient || decreaseParams.recipient,
      amount0Max: ethers.MaxUint256,
      amount1Max: ethers.MaxUint256,
    });
    
    return {
      transactions: [
        { to: tx.to, data: tx.data },
        { to: collectTx.to, data: collectTx.data },
      ],
    };
  }

  async buildRemoveAndSwapToUSDT(params: any): Promise<any> {
    logger.info('Building remove and swap to USDT transaction:', params);
    
    // Step 1: Remove liquidity
    const removeTx = await this.buildRemoveLiquidityTransaction(params);
    
    // Step 2: Build swap transactions for both tokens to USDT
    // Use PancakeSwap V3 Router
    
    return {
      removeTransaction: removeTx,
      swapTransactions: [], // Build swap txs for token0 and token1
    };
  }
}
