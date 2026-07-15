const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  hostname: 'api.github.com',
  path: '/repos/EndZz-/HBMinigun/releases/tags/v0.2.2',
  headers: { 'User-Agent': 'HBMiniGun-Fetch-Script' }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync(path.join(__dirname, 'release.json'), data);
    console.log('Done!');
  });
}).on('error', (err) => {
  fs.writeFileSync(path.join(__dirname, 'release.json'), JSON.stringify({ error: err.message }));
  console.error(err);
});
