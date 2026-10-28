import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  reactToMessage, 
  updateChatPermission 
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:clubId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.route('/:clubId/permission')
  .put(protect, updateChatPermission);

router.route('/:id/react')
  .post(protect, reactToMessage);

export default router;
