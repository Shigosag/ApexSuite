const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/summary', authenticateToken, financeController.getSummary);
router.get('/expenses', authenticateToken, financeController.getExpenses);
router.post('/expenses', authenticateToken, requireRole(['Admin', 'Manager']), financeController.logExpense);
router.post('/income', authenticateToken, requireRole(['Admin', 'Manager']), financeController.logIncome);
router.get('/invoices', authenticateToken, financeController.getInvoices);
router.post('/invoices/pay', authenticateToken, requireRole(['Admin', 'Manager']), financeController.payInvoice);
router.get('/accounts-payable', authenticateToken, financeController.getAccountsPayable);
router.post('/accounts-payable', authenticateToken, requireRole(['Admin', 'Manager']), financeController.logAccountPayable);
router.post('/accounts-payable/pay', authenticateToken, requireRole(['Admin', 'Manager']), financeController.payAccountPayable);
router.get('/chart-of-accounts', authenticateToken, financeController.getChartOfAccounts);

module.exports = router;
