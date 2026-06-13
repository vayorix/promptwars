const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./utils/env');
const { generateMealPlan } = require('./utils/gemini');

// Initialize environmental variables
loadEnv();

const PORT = process.env.PORT || 3000;

// Content types dictionary for static file serving
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Request handler function
async function handleRequest(req, res) {
  const url = req.url;
  const method = req.method;

  console.log(`[HTTP] ${method} ${url}`);

  // CORS Headers - Allow local developer browser queries
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API ROUTE: /api/plan
  if ((url === '/api/plan' || url.startsWith('/api/plan')) && method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const inputs = JSON.parse(body || '{}');

        // Validation & Default Normalization
        const validatedInputs = {
          wakeUp: inputs.wakeUp || "07:00",
          occupation: inputs.occupation || "Remote Worker",
          gymToday: !!inputs.gymToday,
          travelToday: !!inputs.travelToday,
          availableTime: parseInt(inputs.availableTime) || 30,
          familySize: parseInt(inputs.familySize) || 1,
          dietPreference: inputs.dietPreference || "None",
          dailyBudget: parseFloat(inputs.dailyBudget) || 20.00,
          pantry: Array.isArray(inputs.pantry) ? inputs.pantry : []
        };

        // Call our AI Reasoning Engine / Gemini Client
        const plan = await generateMealPlan(validatedInputs);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(plan));
      } catch (err) {
        console.error('API Error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process request data', details: err.message }));
      }
    });
    return;
  }

  // STATIC FILE SERVING
  let relativePath = url === '/' ? 'index.html' : url;
  const queryIndex = relativePath.indexOf('?');
  if (queryIndex !== -1) {
    relativePath = relativePath.slice(0, queryIndex);
  }

  let filePath = path.join(__dirname, 'public', relativePath);
  
  // Basic path traversal prevention check
  const publicDir = path.join(__dirname, 'public');
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden - Path traversal blocked');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Export the request handler for Vercel
module.exports = handleRequest;

// Only start server.listen if run directly in Node (not under Vercel Serverless)
if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 DayDish.AI Server is running at http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}
