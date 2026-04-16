const fs = require('fs');
const path = require('path');
let directUrl = process.env.DIRECT_URL;
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const directMatch = envContent.match(/DIRECT_URL="([^"]+)"/);
  if (directMatch && directMatch[1]) {
    directUrl = directMatch[1];
  }
}
console.log("Parsed URL:", directUrl);