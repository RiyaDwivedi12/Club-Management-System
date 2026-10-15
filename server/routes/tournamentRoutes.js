import express from 'express';
import multer from 'multer';
import { 
  getTournaments, 
  getTournamentById,
  getTournamentBracket, 
  recommendNextRound, 
  uploadGameExcel 
} from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getTournaments);

router.route('/upload')
  .post(protect, authorize('admin', 'faculty'), upload.single('file'), uploadGameExcel);

router.route('/:id')
  .get(getTournamentById);

router.route('/:id/bracket')
  .get(getTournamentBracket);

router.route('/:id/recommend-next-round')
  .post(protect, authorize('admin', 'faculty'), recommendNextRound);

export default router;
