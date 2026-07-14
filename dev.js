const { spawn } = require('child_process');
const http = require('http');

console.log('[Runner] Starting Vite development server...');

// Start Vite dev server with inherited stdio so logs print normally
const viteProcess = spawn('npx.cmd', ['vite'], {
  stdio: 'inherit',
  shell: true
});

let electronStarted = false;
let electronProcess = null;

// Poll the server until it responds, then launch Electron
function pollServer() {
  if (electronStarted) return;

  http.get('http://localhost:5173', (res) => {
    if (!electronStarted) {
      electronStarted = true;
      console.log('\n[Runner] Vite server is ready! Launching Electron...\n');
      launchElectron();
    }
  }).on('error', () => {
    // If connection fails, wait 200ms and try again
    setTimeout(pollServer, 200);
  });
}

function launchElectron() {
  electronProcess = spawn('npx.cmd', ['electron', '.'], {
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5173'
    },
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', (code) => {
    console.log(`[Runner] Electron window closed (Exit code: ${code})`);
    cleanup();
  });
}

function cleanup() {
  console.log('[Runner] Cleaning up processes...');
  if (electronProcess) {
    try { process.kill(electronProcess.pid); } catch (e) {}
    electronProcess = null;
  }
  if (viteProcess) {
    try { process.kill(viteProcess.pid); } catch (e) {}
    // Clean up entire process tree on Windows
    try {
      spawn('taskkill', ['/F', '/T', '/PID', viteProcess.pid]);
    } catch(e) {}
  }
  process.exit();
}

// Handle exit signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start polling
pollServer();
