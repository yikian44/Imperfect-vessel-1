const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8766;
const OUTPUT_FILE = path.join(__dirname, 'imperfect-vessel.gif');

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(OUTPUT_FILE, buffer);
      console.log(`Saved ${buffer.length} bytes to ${OUTPUT_FILE}`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Saved ${buffer.length} bytes successfully`);
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Save server listening on http://localhost:${PORT}`);
});
