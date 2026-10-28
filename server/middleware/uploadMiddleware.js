import multer from 'multer';
import path from 'path';
import { storage as cloudinaryStorage } from '../config/cloudinary.js';

// Fallback local disk storage if Cloudinary is not configured
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user?._id || 'user'}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const storage = isCloudinaryConfigured ? cloudinaryStorage : localStorage;

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB
  }
});

export default upload;
