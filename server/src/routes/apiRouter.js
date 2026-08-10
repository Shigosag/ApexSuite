const express = require('express');
const router = express.Router();
const { apiRateLimiter } = require('../middleware/rateLimiter');

router.use(apiRateLimiter);

router.use('/auth', require('./authRoutes'));
router.use('/company', require('./companyRoutes'));
router.use('/crm', require('./crmRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/pos', require('./posRoutes'));
router.use('/finance', require('./financeRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/audit', require('./auditRoutes'));
router.use('/files', require('./fileRoutes'));

module.exports = router;
