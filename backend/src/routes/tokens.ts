import { Router } from 'express';
import { TokenController } from '../controllers/tokenController';

const router = Router();
const controller = new TokenController();

router.get('/', controller.getPopularTokens);
router.get('/search/:query', controller.searchTokens);
router.get('/:address', controller.getTokenInfo);
router.post('/import', controller.importCustomToken);

export const token_routes = router;
