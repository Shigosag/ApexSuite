const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitized}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

module.exports = upload;
