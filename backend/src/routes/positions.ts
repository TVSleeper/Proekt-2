import { Router } from 'express';
import { PositionController } from '../controllers/positionController';

const router = Router();
const controller = new PositionController();

router.get('/user/:walletAddress', controller.getUserPositions);
router.get('/:positionId', controller.getPositionDetails);
router.post('/add', controller.addLiquidity);
router.post('/remove', controller.removeLiquidity);
router.post('/remove-and-swap', controller.removeAndSwapToUSDT);

export const position_routes = router;
