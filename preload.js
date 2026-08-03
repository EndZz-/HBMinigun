const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  checkTools: () => ipcRenderer.invoke('check-tools'),
  scanDirectory: (dirPath, checkConfig) => ipcRenderer.invoke('scan-directory', dirPath, checkConfig),
  checkProcessedStatus: (files, checkConfig) => ipcRenderer.invoke('check-processed-status', files, checkConfig),
  appendTranscodeFiles: (files, config) => ipcRenderer.invoke('append-transcode-files', files, config),
  startTranscode: (files, config) => ipcRenderer.invoke('start-transcode', files, config),
  stopTranscode: () => ipcRenderer.invoke('stop-transcode'),
  setMaxEngines: (count) => ipcRenderer.invoke('set-max-engines', count),
  moveCopyFiles: (files, config) => ipcRenderer.invoke('move-copy-files', files, config),
  pauseJob: (filePath) => ipcRenderer.invoke('pause-job', filePath),
  resumeJob: (filePath) => ipcRenderer.invoke('resume-job', filePath),
  stopJob: (filePath) => ipcRenderer.invoke('stop-job', filePath),
  pauseAll: () => ipcRenderer.invoke('pause-all'),
  resumeAll: () => ipcRenderer.invoke('resume-all'),
  confirmAppClose: (confirm) => ipcRenderer.invoke('confirm-app-close', confirm),
  generateSamples: (args) => ipcRenderer.invoke('generate-samples', args),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  removeFromQueue: (filePath) => ipcRenderer.invoke('remove-from-queue', filePath),
  getTranscodedFilesInfo: (files, config) => ipcRenderer.invoke('get-transcoded-files-info', files, config),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadAndInstallUpdate: (downloadUrl) => ipcRenderer.invoke('download-and-install-update', downloadUrl),
  finishAndLaunchUpdate: (args) => ipcRenderer.invoke('finish-and-launch-update', args),
  
  saveSessionState: (state) => ipcRenderer.invoke('save-session-state', state),
  loadSessionState: () => ipcRenderer.invoke('load-session-state'),
  hasSavedSession: () => ipcRenderer.invoke('has-saved-session'),
  clearSessionState: () => ipcRenderer.invoke('clear-session-state'),
  getAppLogs: () => ipcRenderer.invoke('get-app-logs'),
  openLogsFolder: () => ipcRenderer.invoke('open-logs-folder'),
  
  showFileContextMenu: (file) => ipcRenderer.send('show-file-context-menu', file),

  // Real-time Event listeners
  onUpdateProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('update-progress', subscription);
    return () => ipcRenderer.removeListener('update-progress', subscription);
  },
  onRescanFile: (callback) => {
    const subscription = (event, file) => callback(file);
    ipcRenderer.on('rescan-file', subscription);
    return () => ipcRenderer.removeListener('rescan-file', subscription);
  },
  onProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('transcode-progress', subscription);
    return () => ipcRenderer.removeListener('transcode-progress', subscription);
  },
  onLog: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('transcode-log', subscription);
    return () => ipcRenderer.removeListener('transcode-log', subscription);
  },
  onFileComplete: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('transcode-file-complete', subscription);
    return () => ipcRenderer.removeListener('transcode-file-complete', subscription);
  },
  onQueueComplete: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('transcode-queue-complete', subscription);
    return () => ipcRenderer.removeListener('transcode-queue-complete', subscription);
  },
  onCloseRequest: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('app-close-request', subscription);
    return () => ipcRenderer.removeListener('app-close-request', subscription);
  },
  onSyncProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('sync-progress', subscription);
    return () => ipcRenderer.removeListener('sync-progress', subscription);
  }
});
