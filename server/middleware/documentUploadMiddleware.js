import multer from 'multer';
import path from 'path';

// Memory storage keeps file buffer in memory for instant XLSX parsing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.tsv', '.txt', '.ods'];

  if (
    allowedExtensions.includes(ext) ||
    !file.mimetype ||
    file.mimetype === 'application/octet-stream' ||
    file.mimetype.includes('excel') ||
    file.mimetype.includes('spreadsheet') ||
    file.mimetype.includes('csv') ||
    file.mimetype.includes('text')
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format '${ext}'. Please upload an Excel (.xlsx, .xls) or CSV file.`), false);
  }
};

const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

export default documentUpload;
