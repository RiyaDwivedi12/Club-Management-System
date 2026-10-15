import express from 'express';
import {
  previewStudentImport,
  confirmStudentImport,
  exportStudentDirectory,
  getStudentDemographics,
  getStudentsList,
  deleteStudent
} from '../controllers/studentImportController.js';
import documentUpload from '../middleware/documentUploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student Directory & Demographics
router.get('/', authorize('admin', 'faculty'), getStudentsList);
router.get('/demographics', authorize('admin', 'faculty'), getStudentDemographics);
router.get('/export', authorize('admin', 'faculty'), exportStudentDirectory);

// Import Preview & Confirm
router.post('/import-preview', authorize('admin'), documentUpload.single('file'), previewStudentImport);
router.post('/import-confirm', authorize('admin'), confirmStudentImport);
router.delete('/:id', authorize('admin'), deleteStudent);

export default router;
