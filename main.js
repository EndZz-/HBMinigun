const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile, exec } = require('child_process');

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow;

// Settings path
const settingsDir = path.join(app.getPath('userData'));
const settingsPath = path.join(settingsDir, 'settings.json');

// Default Settings
const defaultSettings = {
  handbrakePresetPath: '',
  handbrakePresetName: '',
  handbrakePath: '', // Empty means check PATH or default installer locations
  mediaInfoPath: '',  // Empty means check PATH or default installer locations
  engines: 2,
  tempDir: 'C:\\TempHBMG'
};

// Load settings
function loadSettings() {
  try {
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return { ...defaultSettings };
}

// Save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

// Helper to check if file exists
function fileExists(filePath) {
  if (!filePath) return false;
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Check executable path
function checkTool(name, configuredPath, defaultPaths) {
  // 1. Check custom path if configured
  if (configuredPath && fileExists(configuredPath)) {
    return configuredPath;
  }

  // 2. Check default installation paths
  for (const p of defaultPaths) {
    if (fileExists(p)) {
      return p;
    }
  }

  // 3. Try checking system path via where command
  try {
    // Run synchronously
    const { execSync } = require('child_process');
    const out = execSync(`where ${name}.exe`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const firstPath = out.split('\n')[0].trim();
    if (firstPath && fileExists(firstPath)) {
      return firstPath;
    }
  } catch (e) {
    // If where fails, try simply checking if we can spawn it (may be in path but where failed)
    try {
      const { execSync } = require('child_process');
      execSync(`${name} --version`, { stdio: 'ignore' });
      return name; // Available globally
    } catch (e2) {}
  }

  return null;
}

// Get validated tool paths
function getToolPaths(settings) {
  // app.asar.unpacked is where asarUnpack files land — real filesystem paths the OS can execute
  const unpackedBin = path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'bin');

  const hbPath = checkTool('HandBrakeCLI', settings.handbrakePath, [
    path.join(unpackedBin, 'HandBrakeCLI.exe'),
    path.join(app.getAppPath(), 'bin', 'HandBrakeCLI.exe'),
    path.join(app.getAppPath(), 'HandBrakeCLI.exe'),
    'C:\\Program Files\\Handbrake\\HandBrakeCLI.exe',
    'C:\\Program Files\\HandBrakeCLI\\HandBrakeCLI.exe'
  ]);

  const miPath = checkTool('MediaInfo', settings.mediaInfoPath, [
    path.join(unpackedBin, 'MediaInfo.exe'),
    path.join(app.getAppPath(), 'bin', 'MediaInfo.exe'),
    path.join(app.getAppPath(), 'MediaInfo.exe'),
    'C:\\Program Files\\MediaInfo\\MediaInfo.exe'
  ]);

  return { handbrake: hbPath, mediaInfo: miPath };
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return loadSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  return saveSettings(settings);
});

ipcMain.handle('check-tools', () => {
  const settings = loadSettings();
  const paths = getToolPaths(settings);
  return {
    handbrakeInstalled: !!paths.handbrake,
    mediaInfoInstalled: !!paths.mediaInfo,
    handbrakePath: paths.handbrake || '',
    mediaInfoPath: paths.mediaInfo || ''
  };
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Recursively scan directories for media files
async function scanFolder(dirPath, rootPath = dirPath) {
  let results = [];
  const list = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
  const mediaExtensions = ['.mp4', '.mkv', '.avi', '.m4v', '.mov', '.ts', '.wmv', '.flv', '.webm', '.m2ts'];

  for (const entry of list) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subResults = await scanFolder(fullPath, rootPath);
      results = results.concat(subResults);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (mediaExtensions.includes(ext)) {
        const stats = await fs.promises.stat(fullPath);
        results.push({
          name: entry.name,
          fullPath: fullPath,
          relativePath: path.relative(rootPath, fullPath),
          sizeBytes: stats.size,
          extension: ext
        });
      }
    }
  }
  return results;
}

// Run MediaInfo on a file
function runMediaInfo(mediaInfoPath, filePath) {
  return new Promise((resolve) => {
    // If mediaInfoPath is just 'MediaInfo', use exec; if it is a full path, use execFile
    const isFullPath = path.isAbsolute(mediaInfoPath);
    const cmd = isFullPath ? mediaInfoPath : 'MediaInfo';
    const args = ['--Output=JSON', filePath];

    const callback = (error, stdout, stderr) => {
      if (error) {
        console.error(`MediaInfo error for ${filePath}:`, error);
        return resolve(null);
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (err) {
        console.error(`MediaInfo JSON parse error for ${filePath}:`, err);
        resolve(null);
      }
    };

    if (isFullPath) {
      execFile(cmd, args, { maxBuffer: 1024 * 1024 * 10 }, callback);
    } else {
      // Escape paths for exec
      exec(`"${cmd}" --Output=JSON "${filePath}"`, { maxBuffer: 1024 * 1024 * 10 }, callback);
    }
  });
}

function checkFileProcessed(file, checkConfig) {
  if (!checkConfig) return false;
  const { transcodeMode, destinationDir, presetFile } = checkConfig;
  const outputExtension = (presetFile && presetFile.toLowerCase().endsWith('.mp4')) ? '.mp4' : '.mkv';
  const baseNameWithoutExt = path.basename(file.fullPath, path.extname(file.fullPath));
  const outputFileName = baseNameWithoutExt + outputExtension;

  if (transcodeMode === 'replace') {
    const expectedOutPath = path.join(path.dirname(file.fullPath), outputFileName);
    if (file.extension.toLowerCase() !== outputExtension.toLowerCase()) {
      return fs.existsSync(expectedOutPath);
    } else {
      return file.isPlexOk === true;
    }
  } else if (transcodeMode === 'transcodeDir' && destinationDir) {
    const expectedOutPath = path.join(destinationDir, path.dirname(file.relativePath), outputFileName);
    return fs.existsSync(expectedOutPath);
  }
  return false;
}

// Scan directory and analyze files
ipcMain.handle('scan-directory', async (event, dirPath, checkConfig) => {
  const settings = loadSettings();
  const tools = getToolPaths(settings);
  
  if (!tools.mediaInfo) {
    throw new Error('MediaInfo is not installed or not in PATH.');
  }

  // 1. Gather all files
  const files = await scanFolder(dirPath);

  // 2. Query MediaInfo for each file using a concurrency pool
  const results = [];
  const limit = 10; // Concurrency limit
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const fileIndex = index++;
      const file = files[fileIndex];
      
      const mediaInfoData = await runMediaInfo(tools.mediaInfo, file.fullPath);
      const analyzed = parseMediaInfo(file, mediaInfoData);
      analyzed.isProcessed = checkFileProcessed(analyzed, checkConfig);
      results[fileIndex] = analyzed;
    }
  }

  const workers = Array(Math.min(limit, files.length)).fill(0).map(() => worker());
  await Promise.all(workers);

  return results;
});

// Parse MediaInfo JSON
function parseMediaInfo(file, data) {
  const result = {
    ...file,
    videoCodec: 'Unknown',
    videoFormat: '',
    audioStreams: [],
    subtitleStreams: [],
    isPlexOk: false,
    plexIssues: []
  };

  if (!data || !data.media || !data.media.track) {
    result.plexIssues.push('Could not parse media details');
    return result;
  }

  const tracks = data.media.track;

  for (const track of tracks) {
    if (track['@type'] === 'General') {
      if (track.Duration) {
        const dur = parseFloat(track.Duration);
        if (!isNaN(dur)) {
          result.duration = dur > 10000 ? dur / 1000 : dur;
        }
      }
    } else if (track['@type'] === 'Video') {
      result.videoCodec = track.Format || 'Unknown';
      result.videoFormat = track.Format_Commercial || track.Format || '';
      if (track.Duration && !result.duration) {
        const dur = parseFloat(track.Duration);
        if (!isNaN(dur)) {
          result.duration = dur > 10000 ? dur / 1000 : dur;
        }
      }
    } else if (track['@type'] === 'Audio') {
      const language = track.Language_String3 || track.Language || 'und';
      const channels = track.Channels || 'Unknown';
      result.audioStreams.push({
        codec: track.Format || 'Unknown',
        language: language,
        channels: channels
      });
    } else if (track['@type'] === 'Text') {
      const language = track.Language_String3 || track.Language || 'und';
      result.subtitleStreams.push({
        format: track.Format || 'Unknown',
        language: language
      });
    }
  }

  // Plex Compatibility Rules (Green vs Red)
  // 1. Container must be MP4 or MKV
  const allowedExtensions = ['.mp4', '.mkv', '.m4v'];
  if (!allowedExtensions.includes(file.extension.toLowerCase())) {
    result.plexIssues.push(`Container (${file.extension}) is not MP4/MKV`);
  }

  // 2. Video Codec: H.264 (AVC) or H.265 (HEVC)
  const allowedVideo = ['AVC', 'HEVC', 'H264', 'H265', 'x264', 'x265'];
  const videoCodecUpper = result.videoCodec.toUpperCase();
  const isVideoOk = allowedVideo.some(v => videoCodecUpper.includes(v));
  if (!isVideoOk) {
    result.plexIssues.push(`Video Codec (${result.videoCodec}) is not H.264/H.265`);
  }

  // 3. Audio Codec: AAC, AC3, EAC3, MP3
  const allowedAudio = ['AAC', 'AC3', 'EAC3', 'E-AC-3', 'MPEG AUDIO', 'MP3', 'AC-3'];
  for (let i = 0; i < result.audioStreams.length; i++) {
    const stream = result.audioStreams[i];
    const codecUpper = stream.codec.toUpperCase();
    const isAudioOk = allowedAudio.some(a => codecUpper.includes(a));
    if (!isAudioOk) {
      result.plexIssues.push(`Audio stream #${i + 1} (${stream.codec}) is not AAC/AC3/EAC3/MP3`);
    }
  }

  // 4. Subtitle Codec: SRT, WebVTT (or none)
  const allowedSubtitles = ['UTF-8', 'SRT', 'WEBVTT', 'ASS', 'SSA']; // Wait, ASS/SSA was flagged as Red in requirements!
  // The requirements say:
  // "Subtitles: PGS, VOBSUB, ASS/SSA (image-based or styled subtitles which force video transcoding on many clients) are RED"
  // So only SRT / UTF-8 / WebVTT are OK.
  const allowedSubtitlesOk = ['UTF-8', 'SRT', 'WEBVTT'];
  for (let i = 0; i < result.subtitleStreams.length; i++) {
    const sub = result.subtitleStreams[i];
    const formatUpper = sub.format.toUpperCase();
    const isSubOk = allowedSubtitlesOk.some(s => formatUpper.includes(s));
    if (!isSubOk) {
      result.plexIssues.push(`Subtitle stream #${i + 1} (${sub.format}) is not SRT/WebVTT`);
    }
  }

  result.isPlexOk = (result.plexIssues.length === 0);
  return result;
}

// Transcode Queue & Concurrency State
let activeJobs = new Map(); // key: fileId (fullPath), value: spawn process
let pausedJobs = new Set(); // key: fileId (fullPath)
let transcodeQueue = [];
let maxEngines = 2;
let isTranscodingActive = false;
let currentConfig = null;
let forceClose = false;

// ─── UNC / Network-path pipeline state ───────────────────────────────────────
let networkLock = false;          // true while a copy-in or move-back is running
let stagedFiles = new Map();      // key: original fullPath → localSourcePath (staged in TempHBMG\source\)
let networkQueue = [];            // files waiting to be copy-in'd (original file objects)
let prefetchInProgress = false;   // guard so only one prefetch loop runs at a time
const driveTypeCache = new Map(); // drive letter → true (network) | false (local)

// Detect whether a path is on a network location (UNC or mapped network drive).
// Returns a Promise<boolean>.
async function isNetworkPath(filePath) {
  // Raw UNC: starts with \\
  if (filePath.startsWith('\\\\') || filePath.startsWith('//')) return true;

  // Extract drive letter (e.g. "Z" from "Z:\...")
  const driveMatch = filePath.match(/^([A-Za-z]):/);
  if (!driveMatch) return false;
  const letter = driveMatch[1].toUpperCase();

  if (driveTypeCache.has(letter)) return driveTypeCache.get(letter);

  return new Promise((resolve) => {
    // DriveType 4 = Network in Win32_LogicalDisk
    const ps = `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${letter}:'").DriveType`;
    const proc = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]);
    let out = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.on('close', () => {
      const isNet = out.trim() === '4';
      driveTypeCache.set(letter, isNet);
      resolve(isNet);
    });
    proc.on('error', () => {
      driveTypeCache.set(letter, false);
      resolve(false);
    });
  });
}

// Copy a file from src to dest, overwriting dest if it exists.
// Returns a Promise that resolves when done or rejects on error.
function copyFileAsync(src, dest) {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    } catch (e) {}
    const rd = fs.createReadStream(src);
    const wr = fs.createWriteStream(dest);
    rd.on('error', reject);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}

// Acquire the single global network lock, run fn(), then release.
// Calls are serialized — the second caller waits until the first finishes.
const networkLockQueue = [];
let networkLockHeld = false;
function withNetworkLock(fn) {
  return new Promise((resolve, reject) => {
    networkLockQueue.push({ fn, resolve, reject });
    drainNetworkLock();
  });
}
function drainNetworkLock() {
  if (networkLockHeld || networkLockQueue.length === 0) return;
  networkLockHeld = true;
  const { fn, resolve, reject } = networkLockQueue.shift();
  Promise.resolve()
    .then(() => fn())
    .then(resolve, reject)
    .finally(() => {
      networkLockHeld = false;
      drainNetworkLock();
    });
}

// Returns the local source staging path for a given original file path.
function localSourcePath(filePath, settings) {
  const tempDir = settings.tempDir || 'C:\\TempHBMG';
  const srcDir = path.join(tempDir, 'source');
  // Preserve just the filename — same name, flat inside source\
  return path.join(srcDir, path.basename(filePath));
}

// Returns the local transcode output path for a given original file path.
function localTranscodePath(filePath, settings, outputExtension) {
  const tempDir = settings.tempDir || 'C:\\TempHBMG';
  const transcodeDir = path.join(tempDir, 'transcodes');
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(transcodeDir, baseName + outputExtension);
}

// Stage exactly ONE file from networkQueue into local source\.
// Synchronously claims the slot (sets prefetchInProgress) before any async work,
// so concurrent callers cannot double-stage.
function triggerPrefetch(hbPath, settings) {
  if (!isTranscodingActive) return;
  if (networkQueue.length === 0) return;
  if (prefetchInProgress) return;          // already staging one — caller will be notified when done

  // How many files are already in-flight (staged-but-not-started + actively transcoding)?
  const inFlight = stagedFiles.size + activeJobs.size;
  if (inFlight >= maxEngines) return;      // all engine slots occupied — wait for a close event

  // Claim the slot synchronously BEFORE the first await
  prefetchInProgress = true;
  const file = networkQueue.shift();       // also synchronous — no race
  const srcPath = localSourcePath(file.fullPath, settings);

  mainWindow.webContents.send('transcode-progress', {
    filePath: file.fullPath, percent: 0, fps: 0, avgFps: 0, eta: 'Staging...'
  });
  mainWindow.webContents.send('transcode-log', {
    filePath: file.fullPath,
    text: `[Network] Copying to local staging: ${file.name}\n`
  });

  // Run the actual copy asynchronously — the guard is already set
  withNetworkLock(() => copyFileAsync(file.fullPath, srcPath))
    .then(() => {
      stagedFiles.set(file.fullPath, srcPath);
      mainWindow.webContents.send('transcode-log', {
        filePath: file.fullPath,
        text: `[Network] Staging complete: ${file.name}\n`
      });
      prefetchInProgress = false;
      // Start the transcode for this file right away
      processNextInQueue(hbPath, settings);
    })
    .catch((err) => {
      prefetchInProgress = false;
      mainWindow.webContents.send('transcode-log', {
        filePath: file.fullPath,
        text: `[Network Error] Failed to stage ${file.name}: ${err.message}\n`
      });
      mainWindow.webContents.send('transcode-file-complete', {
        filePath: file.fullPath, success: false, error: `Stage failed: ${err.message}`
      });
      // Try the next queued file
      triggerPrefetch(hbPath, settings);
    });
}

// Suspend process helper
function suspendProcess(pid) {
  const cmd = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class P { [DllImport(\\\"ntdll.dll\\\")] public static extern int NtSuspendProcess(IntPtr h); }'; [P]::NtSuspendProcess((Get-Process -Id ${pid}).Handle)"`;
  exec(cmd, (err) => {
    if (err) console.error(`Failed to suspend process ${pid}:`, err);
  });
}

// Resume process helper
function resumeProcess(pid) {
  const cmd = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class P { [DllImport(\\\"ntdll.dll\\\")] public static extern int NtResumeProcess(IntPtr h); }'; [P]::NtResumeProcess((Get-Process -Id ${pid}).Handle)"`;
  exec(cmd, (err) => {
    if (err) console.error(`Failed to resume process ${pid}:`, err);
  });
}

// Stop Transcoding
ipcMain.handle('stop-transcode', () => {
  isTranscodingActive = false;
  transcodeQueue = [];
  networkQueue = [];
  stagedFiles.clear();
  prefetchInProgress = false;
  pausedJobs.clear();
  
  // Kill all running jobs
  for (const [filePath, proc] of activeJobs.entries()) {
    try {
      // On Windows, kill process tree
      spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
      proc.kill();
    } catch (e) {
      console.error(`Failed to kill process for ${filePath}:`, e);
    }
  }
  activeJobs.clear();
  return { success: true };
});

// Dynamically change the concurrent engine cap while running
ipcMain.handle('set-max-engines', (event, count) => {
  maxEngines = Math.max(1, Math.min(8, parseInt(count, 10) || 1));

  // If the cap was raised and work is running, spin up additional engines now.
  if (isTranscodingActive) {
    const settings = loadSettings();
    const tools = getToolPaths(settings);
    const spare = maxEngines - activeJobs.size;
    for (let i = 0; i < Math.min(spare, transcodeQueue.length); i++) {
      processNextInQueue(tools.handbrake, settings);
    }
    // Also expand prefetch depth for any UNC files now that cap increased
    triggerPrefetch(tools.handbrake, settings);
  }
  // Lowering the cap requires no action: processNextInQueue enforces the new
  // limit, so finished engines above it are simply not replaced.
  return { success: true, maxEngines };
});

// Pause individual job
ipcMain.handle('pause-job', (event, filePath) => {
  const proc = activeJobs.get(filePath);
  if (proc) {
    suspendProcess(proc.pid);
    pausedJobs.add(filePath);
    return { success: true };
  }
  return { success: false, error: 'Job not active' };
});

// Resume individual job
ipcMain.handle('resume-job', (event, filePath) => {
  const proc = activeJobs.get(filePath);
  if (proc) {
    resumeProcess(proc.pid);
    pausedJobs.delete(filePath);
    return { success: true };
  }
  return { success: false, error: 'Job not active' };
});

// Stop individual job
ipcMain.handle('stop-job', (event, filePath) => {
  const proc = activeJobs.get(filePath);
  if (proc) {
    try {
      spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
      proc.kill();
    } catch (e) {
      console.error(`Failed to kill job ${filePath}:`, e);
    }
    activeJobs.delete(filePath);
    pausedJobs.delete(filePath);
    return { success: true };
  }
  return { success: false, error: 'Job not active' };
});

// Pause all active engines
ipcMain.handle('pause-all', () => {
  for (const [filePath, proc] of activeJobs.entries()) {
    if (!pausedJobs.has(filePath)) {
      suspendProcess(proc.pid);
      pausedJobs.add(filePath);
    }
  }
  return { success: true };
});

// Resume all active engines
ipcMain.handle('resume-all', () => {
  for (const [filePath, proc] of activeJobs.entries()) {
    if (pausedJobs.has(filePath)) {
      resumeProcess(proc.pid);
      pausedJobs.delete(filePath);
    }
  }
  return { success: true };
});

// Confirm application close (and terminate active transcodes nicely)
ipcMain.handle('confirm-app-close', (event, confirm) => {
  if (confirm) {
    forceClose = true;
    isTranscodingActive = false;
    transcodeQueue = [];
    pausedJobs.clear();
    
    // Kill all running jobs nicely
    for (const [filePath, proc] of activeJobs.entries()) {
      try {
        spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
        proc.kill();
      } catch (e) {
        console.error(`Failed to kill process for ${filePath} during close:`, e);
      }
    }
    activeJobs.clear();
    app.quit();
  }
  return { success: true };
});

// Remove from queue
ipcMain.handle('remove-from-queue', (event, filePath) => {
  const proc = activeJobs.get(filePath);
  if (proc) {
    try {
      spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
      proc.kill();
    } catch (e) {
      console.error(`Failed to kill job ${filePath} during removal:`, e);
    }
    activeJobs.delete(filePath);
    pausedJobs.delete(filePath);
  }

  transcodeQueue = transcodeQueue.filter(f => f.fullPath !== filePath);

  if (proc && isTranscodingActive) {
    const settings = loadSettings();
    const tools = getToolPaths(settings);
    processNextInQueue(tools.handbrake, settings);
  }

  return { success: true };
});

// Start Transcoding
ipcMain.handle('start-transcode', async (event, files, config) => {
  const settings = loadSettings();
  const tools = getToolPaths(settings);

  if (!tools.handbrake) {
    throw new Error('HandBrakeCLI is not installed or not in PATH.');
  }

  // If a queue is already running, treat this as an append rather than rejecting.
  if (isTranscodingActive) {
    // Merge any per-file configs so newly added files transcode with their settings.
    if (config && config.fileConfigs) {
      currentConfig = currentConfig || config;
      currentConfig.fileConfigs = { ...(currentConfig.fileConfigs || {}), ...config.fileConfigs };
    }
    transcodeQueue.push(...files);
    // Fill any spare engine capacity with the newly queued work.
    for (let i = 0; i < Math.min(maxEngines, transcodeQueue.length); i++) {
      processNextInQueue(tools.handbrake, settings);
    }
    return { success: true, appended: true };
  }

  isTranscodingActive = true;
  currentConfig = config;
  maxEngines = Math.max(1, Math.min(8, config.engines || settings.engines));
  transcodeQueue = [...files];

  // Reset UNC pipeline state for the new run
  networkQueue = [];
  stagedFiles.clear();
  prefetchInProgress = false;

  // Ensure TempHBMG\source\ and TempHBMG\transcodes\ exist
  const tempDir = settings.tempDir || 'C:\\TempHBMG';
  try {
    fs.mkdirSync(path.join(tempDir, 'source'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'transcodes'), { recursive: true });
  } catch (err) {
    console.error(`Failed to create temp directories:`, err);
    isTranscodingActive = false;
    throw new Error(`Failed to create Temp Directory ${tempDir}. Check permissions.`);
  }

  // Start workers
  for (let i = 0; i < Math.min(maxEngines, transcodeQueue.length); i++) {
    processNextInQueue(tools.handbrake, settings);
  }

  return { success: true };
});

// Process Next Item in Queue
async function processNextInQueue(hbPath, settings) {
  if (!isTranscodingActive) {
    if (activeJobs.size === 0) {
      isTranscodingActive = false;
      mainWindow.webContents.send('transcode-queue-complete');
    }
    return;
  }

  // Respect the current engine cap.
  if (activeJobs.size >= maxEngines) return;

  // For UNC sources: pop from stagedFiles (already local-copied) rather than transcodeQueue.
  // For local sources: pop directly from transcodeQueue.
  // Determine which file to run next.
  let file = null;
  let isUncFile = false;
  let localInputPath = null;

  // Check if any staged (UNC pre-fetched) file is ready and we have engine capacity
  for (const [origPath, srcLocal] of stagedFiles.entries()) {
    // Only pick staged files that are NOT already actively transcoding
    if (!activeJobs.has(origPath)) {
      file = transcodeQueue.find(f => f.fullPath === origPath);
      if (!file) {
        // File was staged but already removed from queue (e.g. stop-job), clean up
        stagedFiles.delete(origPath);
        try { if (fs.existsSync(srcLocal)) fs.unlinkSync(srcLocal); } catch(e) {}
        continue;
      }
      transcodeQueue.splice(transcodeQueue.indexOf(file), 1);
      isUncFile = true;
      localInputPath = srcLocal;
      break;
    }
  }

  // No staged UNC file ready — try a local file from the queue
  if (!file) {
    if (transcodeQueue.length === 0) {
      // Queue empty and no active jobs means we are done
      if (activeJobs.size === 0 && networkQueue.length === 0 && stagedFiles.size === 0) {
        isTranscodingActive = false;
        mainWindow.webContents.send('transcode-queue-complete');
      }
      return;
    }

    // Peek: is the next file UNC? If so it must go through prefetch, not direct.
    const candidate = transcodeQueue[0];
    const isNet = await isNetworkPath(candidate.fullPath);
    if (isNet) {
      // Move ALL remaining queued UNC files into networkQueue (if not already there),
      // then trigger ONE staging operation.
      const networkPaths = new Set(networkQueue.map(f => f.fullPath));
      const toStage = transcodeQueue.filter(
        f => !networkPaths.has(f.fullPath) && !stagedFiles.has(f.fullPath) && !activeJobs.has(f.fullPath)
      );
      networkQueue.push(...toStage);
      transcodeQueue = transcodeQueue.filter(
        f => !toStage.find(t => t.fullPath === f.fullPath)
      );
      // Stage one file (respects maxEngines cap internally)
      triggerPrefetch(hbPath, settings);
      return;
    }

    // Local file — take it directly
    file = transcodeQueue.shift();
    isUncFile = false;
    localInputPath = file.fullPath;
  }

  let fileIsUncSource;
  try {
    fileIsUncSource = isUncFile || await isNetworkPath(file.fullPath);
  } catch(e) {
    fileIsUncSource = isUncFile;
  }

  let fffile = file;
  try {
    const filePath = fffile.fullPath;

    // Use configured preset format if available, else default to .mkv
    const outputExtension = (currentConfig.presetFile && currentConfig.presetFile.toLowerCase().endsWith('.mp4')) ? '.mp4' : '.mkv';
    const baseNameWithoutExt = path.basename(filePath, path.extname(filePath));
    const outputFileName = baseNameWithoutExt + outputExtension;

    // Create output path based on rules
    let tempOutPath = '';
    let finalOutPath = '';

    if (currentConfig.mode === 'transcodeDir') {
      // Option #1: Transcode to Destination Folder.
      // HandBrake writes directly to the configured destination — no local intermediate.
      // UNC staging ONLY affects the INPUT path (hbInputPath), not the output routing.
      const destDir = currentConfig.destinationDir;
      const finalDir = path.join(destDir, path.dirname(fffile.relativePath));
      try { fs.mkdirSync(finalDir, { recursive: true }); } catch(e) {}
      tempOutPath = path.join(finalDir, outputFileName);
      finalOutPath = tempOutPath;
    } else {
      // Option #2: Replace Source Files (Temp Directory).
      // Transcode output ALWAYS goes to local TempHBMG\transcodes\ first (safe intermediate).
      // After transcode, move or copy to the original file's directory.
      // This is the "Replace" behavior that prevents duplicates/corruption.
      tempOutPath = localTranscodePath(filePath, settings, outputExtension);
      try { fs.mkdirSync(path.dirname(tempOutPath), { recursive: true }); } catch(e) {}
      finalOutPath = path.join(path.dirname(filePath), outputFileName);
    }

    // HandBrake reads from local staged copy (UNC) or directly (local)
    const hbInputPath = isUncFile ? localInputPath : filePath;

    // Construct HandBrake Arguments
    const args = ['-i', hbInputPath, '-o', tempOutPath];

    // Apply Presets or custom per-file transcode configs
    if (currentConfig.presetFile && currentConfig.presetName) {
      args.push('--preset-import-file', currentConfig.presetFile);
      args.push('-Z', currentConfig.presetName);
    } else {
      // Get file specific config or default fallback
      const fileConfig = (currentConfig.fileConfigs && currentConfig.fileConfigs[filePath]) || {
        videoCodec: 'h264',
        quality: 20,
        framerate: 'constant',
        audioCodec: 'AAC',
        audioSource1: file.audioStreams && file.audioStreams.length > 0 ? '1' : 'none',
        audioSource2: 'none',
        subtitleSource1: 'none',
        subtitleSource2: 'none'
      };

      // Container format
      args.push('-f', 'av_mkv');

      // Video options
      const encoder = fileConfig.videoCodec === 'h265' ? 'x265' : 'x264';
      args.push('-e', encoder);
      args.push('-q', fileConfig.quality.toString());

      if (fileConfig.framerate === 'constant') {
        args.push('--cfr');
      } else {
        args.push('--vfr');
      }

      // Audio options
      const selectedAudioTracks = [];
      const audioEncoders = [];
      const encMap = { 'AAC': 'av_aac', 'AC3': 'ac3', 'EAC3': 'eac3', 'MP3': 'mp3', 'Copy': 'copy' };
      const encoderName = encMap[fileConfig.audioCodec] || 'av_aac';

      if (fileConfig.audioSource1 !== 'none') {
        selectedAudioTracks.push(fileConfig.audioSource1);
        audioEncoders.push(encoderName);
      }
      if (fileConfig.audioSource2 !== 'none') {
        selectedAudioTracks.push(fileConfig.audioSource2);
        audioEncoders.push(encoderName);
      }

      if (selectedAudioTracks.length > 0) {
        args.push('-a', selectedAudioTracks.join(','));
        args.push('-E', audioEncoders.join(','));
      } else {
        args.push('-a', 'none');
      }

      // Subtitle options
      const selectedSubTracks = [];
      if (fileConfig.subtitleSource1 !== 'none') {
        selectedSubTracks.push(fileConfig.subtitleSource1);
      }
      if (fileConfig.subtitleSource2 !== 'none') {
        selectedSubTracks.push(fileConfig.subtitleSource2);
      }

      if (selectedSubTracks.length > 0) {
        args.push('-s', selectedSubTracks.join(','));
      } else {
        args.push('-s', 'none');
      }
    }

    mainWindow.webContents.send('transcode-log', {
      filePath: filePath,
      text: `Starting encode for: ${fffile.name}\nInput: ${hbInputPath}\nCommand: HandBrakeCLI ${args.join(' ')}\n`
    });

    const hbProc = spawn(hbPath, args);
    activeJobs.set(filePath, hbProc);

    // If this was a UNC file, immediately try to stage the next one while this transcodes
    if (isUncFile) triggerPrefetch(hbPath, settings);

    // Send initial progress update
    mainWindow.webContents.send('transcode-progress', {
      filePath: filePath, percent: 0, fps: 0, avgFps: 0, eta: 'Calculating...'
    });

    // Parse stdout chunk by chunk
    let buffer = '';
    hbProc.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split(/[\r\n]+/);
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) {
          mainWindow.webContents.send('transcode-log', { filePath: filePath, text: line });
          const percentMatch = line.match(/Encoding: task \d+ of \d+,\s*([\d\.]+)\s*%/);
          if (percentMatch) {
            const percent = parseFloat(percentMatch[1]);
            let fps = 0, avgFps = 0, eta = 'Calculating...';
            const fpsMatch = line.match(/\(\s*([\d\.]+)\s*fps/);
            if (fpsMatch) fps = parseFloat(fpsMatch[1]);
            const avgFpsMatch = line.match(/avg\s*([\d\.]+)\s*fps/);
            if (avgFpsMatch) avgFps = parseFloat(avgFpsMatch[1]);
            const etaMatch = line.match(/ETA\s*([^\)]+)/);
            if (etaMatch) eta = etaMatch[1].trim();
            mainWindow.webContents.send('transcode-progress', {
              filePath: filePath, percent, fps, avgFps, eta
            });
          }
        }
      }
    });

    hbProc.stderr.on('data', (data) => {
      mainWindow.webContents.send('transcode-log', {
        filePath: filePath, text: `[Error] ${data.toString()}`
      });
    });

    // Helper: delete local staged source copy after transcode
    function cleanupLocalSource() {
      if (isUncFile && localInputPath) {
        stagedFiles.delete(filePath);
        try { if (fs.existsSync(localInputPath)) fs.unlinkSync(localInputPath); } catch(e) {}
      }
    }

    hbProc.on('error', (err) => {
      console.error(`HandBrake process error for ${filePath}:`, err);
      mainWindow.webContents.send('transcode-log', {
        filePath: filePath,
        text: `[Process Error] Failed to execute HandBrake: ${err.message}\n`
      });
      if (activeJobs.has(filePath)) {
        activeJobs.delete(filePath);
        cleanupLocalSource();
        try { if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath); } catch(e) {}
        mainWindow.webContents.send('transcode-file-complete', {
          filePath: filePath, success: false, error: err.message
        });
        processNextInQueue(hbPath, settings);
        triggerPrefetch(hbPath, settings);
      }
    });

    hbProc.on('close', async (code) => {
      activeJobs.delete(filePath);

      if (code === 0) {
        mainWindow.webContents.send('transcode-log', {
          filePath: filePath, text: `Encoding completed successfully (Code: ${code}).\n`
        });

        let fileOpSuccess = true;
        try {
          if (currentConfig.mode === 'transcodeDir') {
            // Option #1: Transcode to Destination Folder.
            // Output was already written directly to the destination by HandBrake.
            // Apply post-action (Copy/Move back to source) if configured.
            if (currentConfig.postAction === 'move') {
              const origReplace = path.join(path.dirname(filePath), outputFileName);
              mainWindow.webContents.send('transcode-log', { filePath, text: `[Post-Action] Deleting original: ${filePath}\n` });
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              mainWindow.webContents.send('transcode-log', { filePath, text: `[Post-Action] Moving: ${tempOutPath} -> ${origReplace}\n` });
              fs.renameSync(tempOutPath, origReplace);
              finalOutPath = origReplace;
            } else if (currentConfig.postAction === 'copy') {
              const origReplace = path.join(path.dirname(filePath), outputFileName);
              mainWindow.webContents.send('transcode-log', { filePath, text: `[Post-Action] Copying to: ${origReplace}\n` });
              fs.copyFileSync(tempOutPath, origReplace);
              finalOutPath = origReplace;
            }
          } else {
            // Option #2: Replace Source Files (Temp Directory).
            // Move or copy the local transcode to the original file's location.
            // This behavior is exactly the same whether the source was local or UNC.
            if (currentConfig.replaceAction === 'move') {
              if (fs.existsSync(filePath)) {
                mainWindow.webContents.send('transcode-log', { filePath, text: `Deleting original: ${filePath}\n` });
                fs.unlinkSync(filePath);
              }
              mainWindow.webContents.send('transcode-log', { filePath, text: `Moving to: ${finalOutPath}\n` });
              try { fs.mkdirSync(path.dirname(finalOutPath), { recursive: true }); } catch(e) {}
              fs.renameSync(tempOutPath, finalOutPath);
            } else {
              mainWindow.webContents.send('transcode-log', { filePath, text: `Copying to: ${finalOutPath}\n` });
              try { fs.mkdirSync(path.dirname(finalOutPath), { recursive: true }); } catch(e) {}
              fs.copyFileSync(tempOutPath, finalOutPath);
            }
          }
        } catch (err) {
          fileOpSuccess = false;
          mainWindow.webContents.send('transcode-log', {
            filePath, text: `[File Operation Failed] ${err.message}\n`
          });
        }

        // Clean up local staged source copy now that transcode + move-back are done
        cleanupLocalSource();

        mainWindow.webContents.send('transcode-file-complete', {
          filePath: filePath, success: fileOpSuccess, finalPath: finalOutPath
        });
      } else {
        mainWindow.webContents.send('transcode-log', {
          filePath: filePath, text: `Encoding failed with exit code: ${code}\n`
        });
        cleanupLocalSource();
        try { if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath); } catch(e) {}
        mainWindow.webContents.send('transcode-file-complete', {
          filePath: filePath, success: false, error: `Exit code ${code}`
        });
      }

      // A transcode slot freed up — start another encode and trigger prefetch for next set
      processNextInQueue(hbPath, settings);
      triggerPrefetch(hbPath, settings);
    });

  } catch (err) {
    console.error('Error starting next job in queue:', err);
    if (fffile) {
      mainWindow.webContents.send('transcode-log', {
        filePath: fffile.fullPath,
        text: `[Internal Error] Failed to start transcode: ${err.message}\n`
      });
      mainWindow.webContents.send('transcode-file-complete', {
        filePath: fffile.fullPath, success: false, error: err.message
      });
    }
    setTimeout(() => processNextInQueue(hbPath, settings), 100);
  }
}

// Split command line arguments respecting quotes
function parseRawCli(rawString) {
  const args = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;

  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];
    if ((char === '"' || char === "'") && (i === 0 || rawString[i - 1] !== '\\')) {
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
      } else if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      }
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current);
  }
  return args;
}

// Manual trigger for post-transcode Move/Copy on Option #2
ipcMain.handle('move-copy-files', async (event, files, config) => {
  const results = [];
  const mode = config.replaceAction; // 'move' or 'copy'
  
  for (const file of files) {
    const filePath = file.fullPath;
    
    // Determine the transcode output location under Option #2
    const outputExtension = (config.presetFile && config.presetFile.toLowerCase().endsWith('.mp4')) ? '.mp4' : '.mkv';
    const baseNameWithoutExt = path.basename(filePath, path.extname(filePath));
    const outputFileName = baseNameWithoutExt + outputExtension;
    
    const finalDir = path.join(config.destinationDir, path.dirname(file.relativePath));
    const transcodedFileLocation = path.join(finalDir, outputFileName);
    
    // Original replaced location
    const originalReplacePath = path.join(path.dirname(filePath), outputFileName);

    if (!fs.existsSync(transcodedFileLocation)) {
      results.push({ filePath, success: false, error: 'Transcoded file not found at expected location.' });
      continue;
    }

    try {
      if (mode === 'move') {
        // Delete original
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // Move transcoded file
        fs.renameSync(transcodedFileLocation, originalReplacePath);
      } else {
        // Copy transcoded file
        fs.copyFileSync(transcodedFileLocation, originalReplacePath);
      }
      results.push({ filePath, success: true });
    } catch (err) {
      results.push({ filePath, success: false, error: err.message });
    }
  }

  return results;
});

// Parse preset list from imported preset file
ipcMain.handle('parse-preset-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const presets = JSON.parse(data);
    const names = [];

    function extractNames(node) {
      if (!node) return;
      if (node.PresetName || node.Name) {
        names.push(node.PresetName || node.Name);
      }
      if (node.PresetList && Array.isArray(node.PresetList)) {
        node.PresetList.forEach(extractNames);
      }
      if (node.Children && Array.isArray(node.Children)) {
        node.Children.forEach(extractNames);
      }
    }

    if (Array.isArray(presets)) {
      presets.forEach(extractNames);
    } else {
      extractNames(presets);
    }

    return { success: true, presets: names };
  } catch (err) {
    console.error('Failed to parse preset file:', err);
    return { success: false, error: err.message };
  }
});

// Register preset parser handler
ipcMain.handle('parse-preset-file-ipc', (event, filePath) => {
  return ipcMain.emit('parse-preset-file', event, filePath);
});

// Re-write parse-preset-file handler to register correctly
ipcMain.removeHandler('parse-preset-file-ipc');

// Create MainWindow
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#1c1e22',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Check if running in development mode
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (isTranscodingActive && !forceClose) {
      e.preventDefault();
      mainWindow.webContents.send('app-close-request');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Generate Sample Comparison
ipcMain.handle('generate-samples', async (event, { filePath, timestamp, codec, rf }) => {
  const settings = loadSettings();
  const tools = getToolPaths(settings);
  if (!tools.handbrake) {
    throw new Error('HandBrakeCLI not found. Please install it first.');
  }

  const tempDir = settings.tempDir || 'C:\\TempHBMG';
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create temp dir:', e);
    }
  }

  const now = Date.now();
  const refPath = path.join(tempDir, `sample_ref_${now}.mp4`);
  const samplePath = path.join(tempDir, `sample_out_${now}.mp4`);

  const refArgs = [
    '-i', filePath,
    '-o', refPath,
    '--start-at', `duration:${timestamp}`,
    '--stop-at', 'duration:1',
    '-f', 'av_mkv',
    '-e', 'x264',
    '-q', '10', // lossless/very high quality reference
    '--cfr'
  ];

  const sampleArgs = [
    '-i', filePath,
    '-o', samplePath,
    '--start-at', `duration:${timestamp}`,
    '--stop-at', 'duration:1',
    '-f', 'av_mkv',
    '-e', codec === 'h265' ? 'x265' : 'x264',
    '-q', rf.toString(),
    '--cfr'
  ];

  const runCli = (args) => new Promise((resolve, reject) => {
    const p = spawn(tools.handbrake, args);
    let errorOutput = '';
    p.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`HandBrake exited with code ${code}. Details: ${errorOutput}`));
    });
  });

  try {
    await Promise.all([runCli(refArgs), runCli(sampleArgs)]);

    const refData = fs.readFileSync(refPath).toString('base64');
    const sampleData = fs.readFileSync(samplePath).toString('base64');

    fs.unlink(refPath, () => {});
    fs.unlink(samplePath, () => {});

    return {
      success: true,
      refUri: `data:video/mp4;base64,${refData}`,
      sampleUri: `data:video/mp4;base64,${sampleData}`
    };
  } catch (err) {
    console.error('Sample generation failed:', err);
    if (fs.existsSync(refPath)) fs.unlink(refPath, () => {});
    if (fs.existsSync(samplePath)) fs.unlink(samplePath, () => {});
    return { success: false, error: err.message };
  }
});

// Update checking handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-for-updates', async () => {
  try {
    const https = require('https');
    const options = {
      hostname: 'api.github.com',
      path: '/repos/EndZz-/HBMinigun/releases/latest',
      headers: { 'User-Agent': 'HBMiniGun-Update-Checker' }
    };

    const fetchLatestRelease = () => new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Failed to fetch release: status code ${res.statusCode}`));
          }
        });
      }).on('error', (err) => reject(err));
    });

    const release = await fetchLatestRelease();
    const latestTag = release.tag_name;
    const currentVersion = "v" + app.getVersion();

    const cleanVersion = (v) => v.replace(/^v/, '').trim();
    const semverCompare = (v1, v2) => {
      const parts1 = cleanVersion(v1).split('.').map(Number);
      const parts2 = cleanVersion(v2).split('.').map(Number);
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
      }
      return 0;
    };

    const hasUpdate = semverCompare(latestTag, currentVersion) > 0;
    let downloadUrl = null;
    if (release.assets && Array.isArray(release.assets)) {
      const asset = release.assets.find(a => a.name.toLowerCase().endsWith('.exe'));
      if (asset) {
        downloadUrl = asset.browser_download_url;
      }
    }

    return {
      hasUpdate,
      latestVersion: latestTag,
      releaseNotes: release.body || '',
      downloadUrl
    };
  } catch (err) {
    console.error('Update check failed:', err);
    return { hasUpdate: false, error: err.message };
  }
});

ipcMain.handle('download-and-install-update', async (event, downloadUrl) => {
  if (!downloadUrl) {
    throw new Error('Download URL is required.');
  }

  const https = require('https');
  const os = require('os');
  const tempDir = os.tmpdir();
  const installerPath = path.join(tempDir, `HBMiniGun_setup_${Date.now()}.exe`);

  const downloadFile = (url, dest) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'HBMiniGun-Updater' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download update: status code ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });

  try {
    await downloadFile(downloadUrl, installerPath);

    const child = spawn(installerPath, ['/S'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    app.quit();
    return { success: true };
  } catch (err) {
    console.error('Update download/install failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-processed-status', async (event, files, checkConfig) => {
  return files.map(file => ({
    fullPath: file.fullPath,
    isProcessed: checkFileProcessed(file, checkConfig)
  }));
});

ipcMain.handle('append-transcode-files', async (event, files, config) => {
  // Merge any per-file configs for the appended files.
  if (config && config.fileConfigs) {
    currentConfig = currentConfig || config;
    currentConfig.fileConfigs = { ...(currentConfig.fileConfigs || {}), ...config.fileConfigs };
  }

  transcodeQueue.push(...files);

  // If already running, use any spare engine capacity to start the new work.
  if (isTranscodingActive) {
    const settings = loadSettings();
    const tools = getToolPaths(settings);
    const spare = maxEngines - activeJobs.size;
    for (let i = 0; i < Math.min(spare, transcodeQueue.length); i++) {
      processNextInQueue(tools.handbrake, settings);
    }
  }
  return { success: true };
});

