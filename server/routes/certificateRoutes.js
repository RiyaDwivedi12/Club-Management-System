import express from 'express';
import multer from 'multer';
import { 
  getAllCertificates,
  bulkPreviewCertificates,
  bulkIssueCertificates,
  downloadCertificateTemplate,
  getMyCertificates, 
  verifyCertificate, 
  downloadCertificate,
  deleteCertificate,
  generateCertificates
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'faculty', 'president'), getAllCertificates);

router.route('/bulk-preview')
  .post(protect, authorize('admin', 'faculty', 'president'), upload.single('file'), bulkPreviewCertificates);

router.route('/bulk-issue')
  .post(protect, authorize('admin', 'faculty', 'president'), bulkIssueCertificates);

router.route('/template/download')
  .get(downloadCertificateTemplate);

router.route('/generate')
  .post(protect, authorize('admin', 'faculty', 'president'), generateCertificates);

router.route('/my-certificates')
  .get(protect, getMyCertificates);

router.route('/verify/:hash')
  .get(verifyCertificate);

router.route('/:id/download')
  .get(downloadCertificate);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteCertificate);

export default router;
