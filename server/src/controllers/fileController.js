const db = require('../database/connection');

class FileController {
  async uploadFile(req, res) {
    if (!req.file) return res.status(400).json({ success: false, error: 'No upload file provided.' });

    try {
      const info = await db.query(
        'INSERT INTO files (filename, original_name, mime_type, size_bytes, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user.id]
      );

      res.json({ success: true, file_id: info.rows[0].id, url: `/uploads/${req.file.filename}` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new FileController();
