import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getSessions, revokeSession } from '../controllers/sessionController';

const router = Router();

router.get('/', auth, getSessions);
router.delete('/:id', auth, revokeSession);

export default router;