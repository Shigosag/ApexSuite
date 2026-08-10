const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/customers', authenticateToken, crmController.getCustomers);
router.post('/customers', authenticateToken, crmController.createCustomer);
router.put('/customers/:id', authenticateToken, crmController.updateCustomer);
router.delete('/customers/:id', authenticateToken, crmController.deleteCustomer);

router.get('/leads', authenticateToken, crmController.getLeads);
router.post('/leads', authenticateToken, crmController.createLead);
router.patch('/leads/stage', authenticateToken, crmController.updateLeadStage);

router.get('/notes/:customerId', authenticateToken, crmController.getNotes);
router.post('/notes', authenticateToken, crmController.addNote);

module.exports = router;