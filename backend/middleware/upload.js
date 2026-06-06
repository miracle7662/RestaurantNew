const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload folder beside installed EXE
const BASE_UPLOAD_DIR = path.join(
  path.dirname(process.execPath),
  'uploads'
);

console.log('📁 Upload Base Path:', BASE_UPLOAD_DIR);

// Create required directories
const createUploadDirs = () => {
  const dirs = [
    BASE_UPLOAD_DIR,
    path.join(BASE_UPLOAD_DIR, 'guests'),
    path.join(BASE_UPLOAD_DIR, 'guests', 'documents'),
    path.join(BASE_UPLOAD_DIR, 'guests', 'documents', 'front'),
    path.join(BASE_UPLOAD_DIR, 'guests', 'documents', 'back'),
  ];

  dirs.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('✅ Created:', dir);
      }
    } catch (err) {
      console.error('❌ Failed creating:', dir, err.message);
    }
  });
};

createUploadDirs();

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest;

    switch (file.fieldname) {
      case 'front_side':
        dest = path.join(
          BASE_UPLOAD_DIR,
          'guests',
          'documents',
          'front'
        );
        break;

      case 'back_side':
        dest = path.join(
          BASE_UPLOAD_DIR,
          'guests',
          'documents',
          'back'
        );
        break;

      default:
        dest = path.join(
          BASE_UPLOAD_DIR,
          'guests',
          'documents'
        );
    }

    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const guestId = req.params.guestId || 'temp';
    const ext = path.extname(file.originalname);

    cb(
      null,
      `guest_${guestId}_${Date.now()}_${Math.floor(
        Math.random() * 1000000
      )}${ext}`
    );
  },
});

// Image Validation
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only jpeg, jpg, png, gif, webp, bmp files are allowed'
      ),
      false
    );
  }
};

// Multer Instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Upload Middlewares
const uploadGuestDocuments = upload.fields([
  { name: 'front_side', maxCount: 1 },
  { name: 'back_side', maxCount: 1 },
]);

module.exports = {
  upload,
  uploadGuestDocuments,
  singleUpload: upload.single('image'),
  multipleUpload: upload.array('images', 10),
  BASE_UPLOAD_DIR,
};