import { Router } from 'express';
import { PoolController } from '../controllers/poolController';

const router = Router();
const controller = new PoolController();

router.get('/', controller.getAllPools);
router.get('/by-token/:tokenAddress', controller.getPoolsByToken);
router.get('/:poolAddress', controller.getPoolDetails);
router.get('/:poolAddress/liquidity-ranges', controller.getLiquidityRanges);
router.post('/scan', controller.scanNewPools);

export const pool_routes = router;
