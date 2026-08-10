const { processAIQuery } = require('../services/aiEngineService');

class AIController {
  async query(req, res) {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ success: false, error: 'AI prompt is required.' });

      const result = await processAIQuery(prompt, req.user.company_id, req.user.branch_id);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AIController();
