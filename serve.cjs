/**
 * Local dev server with CORS for testing CookieCraft on external sites (Webflow etc.)
 * Usage: node serve.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const DIST = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // CORS headers - allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // No caching
  res.setHeader('Cache-Control', 'no-store');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`[404] ${req.url}`);
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    console.log(`[200] ${req.url} (${contentType})`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🍪 CookieCraft dev server running at http://localhost:${PORT}`);
  console.log(`\nFiles available:`);
  console.log(`  JS:  http://localhost:${PORT}/cookiecraft.min.js`);
  console.log(`  CSS: http://localhost:${PORT}/cookiecraft.css`);
  console.log(`\nUse this in your Webflow site's custom code:\n`);
  console.log(`<head> section:`);
  console.log(`  <link rel="stylesheet" href="http://localhost:${PORT}/cookiecraft.css">`);
  console.log(`\n</body> section:`);
  console.log(`  <script src="http://localhost:${PORT}/cookiecraft.min.js"></script>`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
