const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/guests',
    'uploads/guests/documents',
    'uploads/guests/documents/front',
    'uploads/guests/documents/back'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file fieldname
    let dest = 'uploads/guests/documents/';
    if (file.fieldname === 'front_side') {
      dest += 'front';
    } else if (file.fieldname === 'back_side') {
      dest += 'back';
    } else {
      dest = 'uploads/guests/documents';
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: guestId_timestamp_random.ext
    const guestId = req.params.guestId || 'temp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `guest_${guestId}_${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, bmp)'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for handling multiple file uploads
const uploadGuestDocuments = upload.fields([
  { name: 'front_side', maxCount: 1 },
  { name: 'back_side', maxCount: 1 }
]);

module.exports = {
  upload,
  uploadGuestDocuments,
  singleUpload: upload.single('image'),
  multipleUpload: upload.array('images', 10)
};