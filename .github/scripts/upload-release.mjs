#!/usr/bin/env node
// upload-release.mjs — creates a GitHub release and uploads installer assets.
// Called by the release workflow after electron-builder produces the installer.

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createReadStream, statSync } from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO        = process.env.GITHUB_REPOSITORY;   // e.g. EndZz-/HBMinigun
const VERSION     = process.env.GITHUB_REF_NAME;      // e.g. v0.9.8
const DIST        = process.env.DIST_DIR || 'dist_electron';

if (!GITHUB_TOKEN || !REPO || !VERSION) {
  console.error('Missing required env vars: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_REF_NAME');
  process.exit(1);
}

// --- Build release notes from git log since last tag ---
let notes = '';
try {
  const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' })
    .split('\n').map(t => t.trim()).filter(Boolean);
  const prevTag = tags.find(t => t !== VERSION);
  const range = prevTag ? `${prevTag}..HEAD` : 'HEAD';
  notes = execSync(`git log ${range} --pretty=format:"- %s" -n 30`, { encoding: 'utf8' }).trim();
} catch (e) {
  notes = `Release ${VERSION}`;
}

// --- Create the GitHub release ---
async function apiPost(path, body) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function uploadAsset(uploadUrl, filePath, contentType) {
  const name = filePath.split(/[\\/]/).pop();
  const size = statSync(filePath).size;
  console.log(`  Uploading ${name} (${(size / 1024 / 1024).toFixed(1)} MB)...`);
  const res = await fetch(`${uploadUrl}?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': contentType,
      'Content-Length': size
    },
    body: readFileSync(filePath),
    duplex: 'half'
  });
  const data = await res.json();
  if (data.state === 'uploaded') {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}:`, JSON.stringify(data));
  }
}

(async () => {
  console.log(`Creating release ${VERSION}...`);
  const release = await apiPost('/releases', {
    tag_name: VERSION,
    name: VERSION,
    body: notes,
    draft: false,
    prerelease: false
  });

  if (!release.upload_url) {
    console.error('Failed to create release:', JSON.stringify(release));
    process.exit(1);
  }

  const uploadUrl = release.upload_url.replace(/\{.*}/, '');
  console.log(`Release created. Upload URL: ${uploadUrl}`);

  // Find assets in dist_electron
  const files = readdirSync(DIST);
  const exe      = files.find(f => f.endsWith('.exe') && !f.includes('blockmap') && !f.includes('uninstaller'));
  const blockmap = files.find(f => f.endsWith('.exe.blockmap'));
  const yml      = files.find(f => f === 'latest.yml');

  if (!exe) { console.error('No installer .exe found in', DIST); process.exit(1); }

  await uploadAsset(uploadUrl, join(DIST, exe),      'application/octet-stream');
  await uploadAsset(uploadUrl, join(DIST, blockmap), 'application/octet-stream');
  if (yml) await uploadAsset(uploadUrl, join(DIST, yml), 'text/yaml');

  console.log('Done.');
})();
