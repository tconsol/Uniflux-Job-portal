const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

const secret = crypto.randomBytes(64).toString('hex');

if (fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('JWT_SECRET=')) {
    content = content.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${secret}`);
  } else {
    content += `\nJWT_SECRET=${secret}\n`;
  }
  fs.writeFileSync(envPath, content);
  console.log('JWT_SECRET regenerated in .env');
} else {
  let template = fs.readFileSync(examplePath, 'utf8');
  template = template.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${secret}`);
  fs.writeFileSync(envPath, template);
  console.log('.env created from .env.example with fresh JWT_SECRET');
}
