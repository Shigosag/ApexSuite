const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await authService.login(email, password, ip, userAgent);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
    }
  }

  async register(req, res) {
    try {
      const { company_name, admin_name, email, password } = req.body;
      if (!company_name || !admin_name || !email || !password) {
        return res.status(400).json({ success: false, error: 'All registration parameters are required.' });
      }

      const result = await authService.registerCompany(company_name, admin_name, email, password);
      res.json({ success: true, message: 'Enterprise company workspace created successfully!', ...result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
      }

      await authService.changePassword(req.user.id, current_password, new_password);
      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AuthController();
