const fs = require('fs');
const path = require('path');

/**
 * Custom zero-dependency .env file parser.
 * Reads the .env file in the project root and populates process.env.
 */
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) return;
        
        const equalsIndex = line.indexOf('=');
        if (equalsIndex > 0) {
          const key = line.slice(0, equalsIndex).trim();
          let val = line.slice(equalsIndex + 1).trim();
          
          // Strip surrounding quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (err) {
      console.warn('Warning: Failed to load .env file:', err.message);
    }
  }
}

module.exports = { loadEnv };
