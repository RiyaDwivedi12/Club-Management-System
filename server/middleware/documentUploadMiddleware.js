import multer from 'multer';

// Memory storage keeps file buffer in memory for instant XLSX parsing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv',
    'text/plain'
  ];

  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV file.'), false);
  }
};

const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 15 // 15MB limit
  }
});

export default documentUpload;
