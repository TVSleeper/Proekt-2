import { Request, Response, NextFunction } from 'express';
import { PoolService } from '../services/poolService';
import { logger } from '../utils/logger';

export class PoolController {
  private poolService: PoolService;

  constructor() {
    this.poolService = new PoolService();
  }

  getAllPools = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, sortBy, page, limit } = req.query;
      const pools = await this.poolService.getAllPools({
        token: token as string,
        sortBy: sortBy as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
      });
      res.json(pools);
    } catch (error) {
      logger.error('Error getting all pools:', error);
      next(error);
    }
  };

  getPoolsByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress } = req.params;
      const pools = await this.poolService.getPoolsByToken(tokenAddress);
      res.json(pools);
    } catch (error) {
      logger.error('Error getting pools by token:', error);
      next(error);
    }
  };

  getPoolDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { poolAddress } = req.params;
      const pool = await this.poolService.getPoolDetails(poolAddress);
      res.json(pool);
    } catch (error) {
      logger.error('Error getting pool details:', error);
      next(error);
    }
  };

  getLiquidityRanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { poolAddress } = req.params;
      const ranges = await this.poolService.getLiquidityRanges(poolAddress);
      res.json(ranges);
    } catch (error) {
      logger.error('Error getting liquidity ranges:', error);
      next(error);
    }
  };

  scanNewPools = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.poolService.scanNewPools();
      res.json({ success: true, message: 'Pool scan initiated' });
    } catch (error) {
      logger.error('Error scanning new pools:', error);
      next(error);
    }
  };
}
