import express from 'express';
import { 
  generateCertificates, 
  getMyCertificates, 
  verifyCertificate, 
  getAllCertificates,
  downloadCertificate 
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'faculty', 'president'), getAllCertificates);

router.route('/generate')
  .post(protect, authorize('admin', 'faculty', 'president'), generateCertificates);

router.route('/my-certificates')
  .get(protect, getMyCertificates);

router.route('/verify/:hash')
  .get(verifyCertificate);

router.route('/:id/download')
  .get(downloadCertificate);

export default router;
