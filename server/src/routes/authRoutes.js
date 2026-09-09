const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auditLog } = require('../middleware/auditMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', authRateLimiter, auditLog('USER_LOGIN'), authController.login);
router.post('/register', authRateLimiter, auditLog('COMPANY_REGISTER'), authController.register);
router.post('/change-password', authenticateToken, auditLog('PASSWORD_CHANGE'), authController.changePassword);

module.exports = router;
