import express from 'express';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  getClasses,
  createClass,
  deleteClass,
  recordOfflinePayment,
  batchRecordOfflinePayment,
  revertPayment,
  uploadOfflineDoc,
  aiSegregateDocument,
  getOfflineDocuments,
  getDocumentPreview,
  exportClassRevenueExcel,
  exportClassRevenuePdf,
  exportSingleClassPdf
} from '../controllers/classFeeController.js';
import offlineDocUpload from '../middleware/offlineDocUploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Department endpoints
router.get('/departments', getDepartments);
router.post('/departments', authorize('admin'), createDepartment);
router.delete('/departments/:id', authorize('admin'), deleteDepartment);

// Class endpoints
router.get('/classes', getClasses);
router.post('/classes', authorize('admin'), createClass);
router.delete('/classes/:id', authorize('admin'), deleteClass);

// Offline Payment Operations
router.post('/offline-payment', authorize('admin'), recordOfflinePayment);
router.post('/batch-offline-payment', authorize('admin'), batchRecordOfflinePayment);
router.post('/revert-payment', authorize('admin'), revertPayment);

// Offline Document / PDF Uploads, Previews & AI Auto-Segregation
router.post('/upload-doc', authorize('admin'), offlineDocUpload.single('file'), uploadOfflineDoc);
router.post('/documents/:id/ai-segregate', authorize('admin'), aiSegregateDocument);
router.get('/documents', getOfflineDocuments);
router.get('/documents/:id/preview', getDocumentPreview);

// Exporting Class Receipts / Ledgers (Excel & PDF)
router.get('/export/excel', authorize('admin', 'faculty'), exportClassRevenueExcel);
router.get('/export/pdf', authorize('admin', 'faculty'), exportClassRevenuePdf);
router.get('/classes/:id/export/pdf', authorize('admin', 'faculty'), exportSingleClassPdf);

export default router;
