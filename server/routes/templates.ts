import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Path to the templates directory
const templatesDir = path.join(process.cwd(), 'public/templates');

// Route to serve template files
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(templatesDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Template file not found' });
  }

  // Determine content type
  let contentType = 'application/octet-stream';
  if (filename.endsWith('.xlsx')) {
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (filename.endsWith('.csv')) {
    contentType = 'text/csv';
  } else if (filename.endsWith('.docx')) {
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (filename.endsWith('.pdf')) {
    contentType = 'application/pdf';
  }

  // Set headers for download
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

export default router;