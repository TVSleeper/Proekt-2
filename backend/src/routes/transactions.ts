import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';

const router = Router();
const controller = new TransactionController();

router.get('/user/:walletAddress', controller.getUserTransactions);
router.get('/tx/:hash', controller.getTransactionStatus);
router.post('/build-add', controller.buildAddLiquidityTx);
router.post('/build-remove', controller.buildRemoveLiquidityTx);
router.post('/build-swap', controller.buildSwapToUSDTTx);

export const transaction_routes = router;
