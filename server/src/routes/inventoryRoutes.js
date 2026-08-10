const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/products', authenticateToken, inventoryController.getProducts);
router.post('/products', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.createProduct);
router.delete('/products/:id', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.deleteProduct);

router.post('/stock-adjust', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.adjustStock);
router.post('/stock-transfer', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.transferStock);

router.get('/categories', authenticateToken, inventoryController.getCategories);
router.post('/categories', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.createCategory);

router.get('/suppliers', authenticateToken, inventoryController.getSuppliers);
router.post('/suppliers', authenticateToken, requireRole(['Admin', 'Manager']), inventoryController.createSupplier);

module.exports = router;
