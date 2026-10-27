import express from 'express';
import multer from 'multer';
import { 
  getTournaments, 
  getTournamentById,
  getTournamentBracket, 
  recommendNextRound, 
  uploadGameExcel,
  aiArrangeTournament,
  exportTournamentPdf
} from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getTournaments);

router.route('/ai-arrange')
  .post(protect, authorize('admin', 'faculty', 'president', 'vice_president'), upload.single('file'), aiArrangeTournament);

router.route('/upload')
  .post(protect, authorize('admin', 'faculty', 'president', 'vice_president'), upload.single('file'), uploadGameExcel);

router.route('/:id/export/pdf')
  .get(exportTournamentPdf);

router.route('/:id')
  .get(getTournamentById);

router.route('/:id/bracket')
  .get(getTournamentBracket);

router.route('/:id/recommend-next-round')
  .post(protect, authorize('admin', 'faculty'), recommendNextRound);

export default router;
