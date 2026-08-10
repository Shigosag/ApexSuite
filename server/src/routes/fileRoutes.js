const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', authenticateToken, upload.single('file'), fileController.uploadFile);

module.exports = router;
