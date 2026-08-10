const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/checkout', authenticateToken, posController.checkout);
router.get('/orders', authenticateToken, posController.getOrders);
router.post('/refund', authenticateToken, requireRole(['Admin', 'Manager']), posController.processRefund);
router.get('/receipt/:orderId/pdf', authenticateToken, posController.downloadReceiptPDF);

module.exports = router;
