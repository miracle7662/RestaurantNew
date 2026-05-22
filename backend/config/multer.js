console.log('🔵 MULTER CONFIG FILE IS LOADED');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get absolute path – assuming this file is in backend/routes or backend/config
const uploadDir = path.resolve(__dirname, '../public/uploads/brands');

// Create directory recursively with error handling
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Created upload directory: ${uploadDir}`);
  } else {
    console.log(`✅ Upload directory already exists: ${uploadDir}`);
  }
} catch (err) {
  console.error(`❌ Failed to create upload directory: ${err.message}`);
  // Optionally fallback to a different path
  // For example: path.join(process.cwd(), 'uploads/brands')
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Re-check directory existence (in case deleted at runtime)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `brand-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;