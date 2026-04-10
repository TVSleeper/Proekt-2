import { Request, Response, NextFunction } from 'express';
import { PositionService } from '../services/positionService';
import { logger } from '../utils/logger';

export class PositionController {
  private positionService: PositionService;

  constructor() {
    this.positionService = new PositionService();
  }

  getUserPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.params;
      const positions = await this.positionService.getUserPositions(walletAddress);
      res.json(positions);
    } catch (error) {
      logger.error('Error getting user positions:', error);
      next(error);
    }
  };

  getPositionDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { positionId } = req.params;
      const position = await this.positionService.getPositionDetails(positionId);
      res.json(position);
    } catch (error) {
      logger.error('Error getting position details:', error);
      next(error);
    }
  };

  addLiquidity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const transaction = await this.positionService.buildAddLiquidityTransaction(params);
      res.json(transaction);
    } catch (error) {
      logger.error('Error building add liquidity transaction:', error);
      next(error);
    }
  };

  removeLiquidity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const transaction = await this.positionService.buildRemoveLiquidityTransaction(params);
      res.json(transaction);
    } catch (error) {
      logger.error('Error building remove liquidity transaction:', error);
      next(error);
    }
  };

  removeAndSwapToUSDT = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const transactions = await this.positionService.buildRemoveAndSwapToUSDT(params);
      res.json(transactions);
    } catch (error) {
      logger.error('Error building remove and swap transaction:', error);
      next(error);
    }
  };
}
