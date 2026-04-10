import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transactionService';
import { logger } from '../utils/logger';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress } = req.params;
      const transactions = await this.transactionService.getUserTransactions(walletAddress);
      res.json(transactions);
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      next(error);
    }
  };

  getTransactionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hash } = req.params;
      const status = await this.transactionService.getTransactionStatus(hash);
      res.json(status);
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      next(error);
    }
  };

  buildAddLiquidityTx = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const tx = await this.transactionService.buildAddLiquidityTx(params);
      res.json(tx);
    } catch (error) {
      logger.error('Error building add liquidity tx:', error);
      next(error);
    }
  };

  buildRemoveLiquidityTx = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const tx = await this.transactionService.buildRemoveLiquidityTx(params);
      res.json(tx);
    } catch (error) {
      logger.error('Error building remove liquidity tx:', error);
      next(error);
    }
  };

  buildSwapToUSDTTx = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.body;
      const tx = await this.transactionService.buildSwapToUSDTTx(params);
      res.json(tx);
    } catch (error) {
      logger.error('Error building swap to USDT tx:', error);
      next(error);
    }
  };
}
