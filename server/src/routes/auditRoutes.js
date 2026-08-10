const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/logs', authenticateToken, requireRole(['Admin']), auditController.getLogs);

module.exports = router;
