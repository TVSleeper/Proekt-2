import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';
import { logger } from '../utils/logger';

export class TokenController {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = new TokenService();
  }

  getPopularTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.tokenService.getPopularTokens();
      res.json(tokens);
    } catch (error) {
      logger.error('Error getting popular tokens:', error);
      next(error);
    }
  };

  searchTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;
      const tokens = await this.tokenService.searchTokens(query);
      res.json(tokens);
    } catch (error) {
      logger.error('Error searching tokens:', error);
      next(error);
    }
  };

  getTokenInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const token = await this.tokenService.getTokenInfo(address);
      res.json(token);
    } catch (error) {
      logger.error('Error getting token info:', error);
      next(error);
    }
  };

  importCustomToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.body;
      if (!address) {
        res.status(400).json({ error: 'Token address is required' });
        return;
      }
      const token = await this.tokenService.importToken(address);
      res.json(token);
    } catch (error) {
      logger.error('Error importing token:', error);
      next(error);
    }
  };
}
