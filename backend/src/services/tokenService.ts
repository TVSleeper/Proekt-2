import { Token } from '../types';
import { web3Service } from './web3Service';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { CONTRACTS } from '../../../contracts/types/addresses';

export class TokenService {
  async getPopularTokens(): Promise<Token[]> {
    logger.info('Getting popular tokens');
    
    // Return hardcoded popular tokens or query database
    const popularTokens = Object.entries(CONTRACTS.tokens).map(([symbol, address]) => ({
      address,
      symbol,
      name: symbol,
      decimals: 18,
    }));

    return popularTokens;
  }

  async searchTokens(query: string): Promise<Token[]> {
    logger.info('Searching tokens:', query);
    
    // Search by symbol, name, or address in database
    // Return matching tokens
    
    return [];
  }

  async getTokenInfo(address: string): Promise<Token | null> {
    logger.info('Getting token info:', address);
    
    try {
      const tokenInfo = await web3Service.getTokenInfo(address);
      
      return {
        address,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        priceUSD: 0, // Fetch from price service
      };
    } catch (error) {
      logger.error('Failed to get token info:', error);
      return null;
    }
  }

  async importToken(address: string): Promise<Token> {
    logger.info('Importing custom token:', address);
    
    // Validate token exists
    const tokenInfo = await this.getTokenInfo(address);
    
    if (!tokenInfo) {
      throw new Error('Invalid token address');
    }

    // Save to database if not exists
    // Return token info
    
    return tokenInfo;
  }
}
