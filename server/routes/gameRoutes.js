import express from 'express';
import multer from 'multer';
import { getGames, createGame } from '../controllers/gameController.js';
import { uploadGameExcel } from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getGames)
  .post(protect, authorize('admin', 'faculty'), createGame);

router.route('/:gameId/upload')
  .post(protect, authorize('admin', 'faculty'), upload.single('file'), uploadGameExcel);

export default router;
