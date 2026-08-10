const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auditLog } = require('../middleware/auditMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/login', authRateLimiter, auditLog('USER_LOGIN'), authController.login);
router.post('/register', authRateLimiter, auditLog('COMPANY_REGISTER'), authController.register);
router.post('/reset-password', authRateLimiter, auditLog('PASSWORD_RESET'), authController.resetPassword);

module.exports = router;
