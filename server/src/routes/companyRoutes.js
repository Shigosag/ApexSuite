const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/branches', authenticateToken, companyController.getBranches);
router.post('/branches', authenticateToken, requireRole(['Admin']), companyController.createBranch);
router.put('/branches/:branchId', authenticateToken, requireRole(['Admin']), companyController.updateBranch);
router.delete('/branches/:branchId', authenticateToken, requireRole(['Admin']), companyController.deleteBranch);

router.get('/employees', authenticateToken, companyController.getEmployees);
router.post('/employees', authenticateToken, requireRole(['Admin']), companyController.createEmployee);
router.delete('/employees/:employeeId', authenticateToken, requireRole(['Admin']), companyController.deleteEmployee);

router.delete('/account', authenticateToken, requireRole(['Admin']), companyController.deleteAccount);

module.exports = router;