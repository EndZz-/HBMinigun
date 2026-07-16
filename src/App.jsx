import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Settings,
  Play, 
  Square, 
  Trash2, 
  Copy, 
  Move, 
  AlertTriangle, 
  CheckCircle, 
  Pause,
  X, 
  Search, 
  ChevronRight, 
  Loader2, 
  Sliders, 
  FileVideo, 
  ExternalLink,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Advanced fuzzy language matching engine (handles 2-letter, 3-letter, regional codes, full names, and aliases)
const languagesMatch = (streamLang, searchLang) => {
  if (!streamLang || !searchLang) return false;
  
  const s = streamLang.toLowerCase().trim();
  const q = searchLang.toLowerCase().trim();
  
  // 1. Direct checks
  if (s === q || s.includes(q) || q.includes(s)) return true;
  
  // 2. Define expanded fuzzy dictionaries mapping 3-letter, 2-letter, full-names, regional codes, and common aliases
  const langGroups = [
    {
      ids: ['eng', 'en', 'english'],
      aliases: ['eng', 'en', 'english', 'us', 'gb', 'uk', 'ca', 'au', 'en-us', 'en-gb', 'en-ca', 'en-au', 'original']
    },
    {
      ids: ['spa', 'es', 'spanish'],
      aliases: ['spa', 'es', 'spanish', 'es-419', 'es-mx', 'es-es', 'español', 'espanol', 'castilian', 'castellano']
    },
    {
      ids: ['fre', 'fr', 'french'],
      aliases: ['fre', 'fr', 'fra', 'french', 'fr-fr', 'fr-ca', 'canadian french', 'français', 'francais']
    },
    {
      ids: ['ger', 'de', 'german'],
      aliases: ['ger', 'de', 'deu', 'german', 'deutsch', 'de-de', 'de-at', 'de-ch']
    },
    {
      ids: ['jpn', 'ja', 'japanese'],
      aliases: ['jpn', 'ja', 'japanese', 'jp', 'nihongo', 'ja-jp']
    },
    {
      ids: ['ita', 'it', 'italian'],
      aliases: ['ita', 'it', 'italian', 'it-it', 'italiano']
    },
    {
      ids: ['chi', 'zh', 'chinese'],
      aliases: ['chi', 'zh', 'zho', 'chinese', 'mandarin', 'cantonese', 'zh-cn', 'zh-tw', 'zh-hk', 'zh-sg', 'zh-mo']
    },
    {
      ids: ['kor', 'ko', 'korean'],
      aliases: ['kor', 'ko', 'korean', 'ko-kr', 'hangugeo', 'hangul']
    },
    {
      ids: ['rus', 'ru', 'russian'],
      aliases: ['rus', 'ru', 'russian', 'ru-ru', 'russkiy']
    },
    {
      ids: ['por', 'pt', 'portuguese'],
      aliases: ['por', 'pt', 'portuguese', 'português', 'portugues', 'pt-br', 'pt-pt']
    }
  ];

  // Helper to remove dashes, brackets, spaces, and special symbols
  const sanitize = (str) => {
    return str.replace(/[^a-z0-9]/gi, '').toLowerCase();
  };

  const cleanS = sanitize(s);
  const cleanQ = sanitize(q);

  // 3. Search groups
  for (const group of langGroups) {
    const searchMatch = group.ids.includes(q) || group.aliases.some(a => sanitize(a) === cleanQ || cleanQ.includes(sanitize(a)));
    
    if (searchMatch) {
      const streamMatch = group.ids.includes(s) || group.aliases.some(a => {
        const cleanA = sanitize(a);
        return cleanS === cleanA || cleanS.includes(cleanA) || cleanA.includes(cleanS);
      });
      
      if (streamMatch) return true;
    }
  }

  // 4. Fallback check: character prefix matching
  if (cleanS.length >= 2 && cleanQ.length >= 2) {
    if (cleanS.startsWith(cleanQ) || cleanQ.startsWith(cleanS)) {
      return true;
    }
  }
  
  return false;
};


export default function App() {
  if (typeof window === 'undefined' || !window.api) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0c0e12',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#0084ff', marginBottom: '20px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 11 5 3-5 3v-6Z"/></svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>HB Minigun</h1>
        <p style={{ color: '#8b9bb4', maxWidth: '500px', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          This is an <strong>Electron Desktop Application</strong>. It requires native system permissions to scan directories and execute HandBrake CLI transcoding.
        </p>
        <div style={{ background: '#1c202a', border: '1px solid #2e3547', padding: '16px 24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', textAlign: 'left', maxWidth: '500px' }}>
          <div><strong>How to Run:</strong></div>
          <div>1. Navigate to the project directory: <code>c:\Users\aquez\Antigravity_Project\HBMiniGun</code></div>
          <div>2. Double-click the <strong>RUN_HBMiniGun.bat</strong> file.</div>
          <div>3. A native desktop window will open automatically.</div>
        </div>
      </div>
    );
  }

  // App States
  const [scannedFiles, setScannedFiles] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [scanDir, setScanDir] = useState('');
  
  // Settings States
  const [settings, setSettings] = useState({
    handbrakePresetPath: '',
    handbrakePresetName: '',
    handbrakePath: '',
    mediaInfoPath: '',
    engines: 2,
    tempDir: 'C:\\TempHBMG'
  });
  const [toolsState, setToolsState] = useState({
    handbrakeInstalled: true,
    mediaInfoInstalled: true,
    handbrakePath: '',
    mediaInfoPath: ''
  });
  
  // UI Panels / Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailsFile, setDetailsFile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'plex-ok', 'plex-not-ok'
  const [transcodedFilter, setTranscodedFilter] = useState('all'); // 'all', 'not-transcoded', 'transcoded'
  const [sortBy, setSortBy] = useState('name'); // 'name','size','plexStatus','transcodedStatus','videoCodec','audioTracks','extension'
  const [sortDir, setSortDir] = useState('asc');
  const [dragActive, setDragActive] = useState(false);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [sampleFile, setSampleFile] = useState(null);
  const [sampleConfig, setSampleConfig] = useState(null);
  const [directoryOptionsCollapsed, setDirectoryOptionsCollapsed] = useState(true);
  const [presetProfileCollapsed, setPresetProfileCollapsed] = useState(true);
  const [batchApplyCollapsed, setBatchApplyCollapsed] = useState(true);
  const [autoScanCollapsed, setAutoScanCollapsed] = useState(true);
  const [autoRescanInterval, setAutoRescanInterval] = useState(0); // minutes, 0 means disabled
  const [autoAddToQueue, setAutoAddToQueue] = useState(false);
  const [timeUntilNextScan, setTimeUntilNextScan] = useState(0); // seconds
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [appVersion, setAppVersion] = useState('');

  // Transcoding Config
  const [enginesCount, setEnginesCount] = useState(2);
  const [transcodeMode, setTranscodeMode] = useState('transcodeDir'); // Option #1: Transcode to Directory
  const [postAction, setPostAction] = useState('none'); // Default: 'none' (Do Nothing)
  const [replaceAction, setReplaceAction] = useState('move'); // 'move', 'copy' (for Option #2 temp replacement)
  const [destinationDir, setDestinationDir] = useState('');
  
  // Resizing states for bottom queue drawer
  const [queueHeight, setQueueHeight] = useState(220);
  const [isResizingQueue, setIsResizingQueue] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingQueue) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 120 && newHeight <= 600) {
        setQueueHeight(newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingQueue(false);
    };
    
    if (isResizingQueue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingQueue]);

  const triggerUpdateCheck = async (silent = false) => {
    setIsCheckingUpdates(true);
    try {
      const res = await window.api.checkForUpdates();
      setIsCheckingUpdates(false);
      if (res && res.hasUpdate) {
        setUpdateInfo(res);
        setUpdateModalOpen(true);
      } else {
        if (!silent) {
          showToast('Latest Version', `You are running the latest version of HB Minigun (v${appVersion}).`, 'success');
        }
      }
    } catch (err) {
      setIsCheckingUpdates(false);
      if (!silent) {
        showToast('Update Check Failed', err.message || 'Error checking for updates', 'warning');
      }
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;
    setIsDownloadingUpdate(true);
    setDownloadError(null);
    try {
      const res = await window.api.downloadAndInstallUpdate(updateInfo.downloadUrl);
      if (!res.success) {
        setIsDownloadingUpdate(false);
        setDownloadError(res.error || 'Failed to install update.');
      }
    } catch (err) {
      setIsDownloadingUpdate(false);
      setDownloadError(err.message || 'Error occurred during downloading update.');
    }
  };

  useEffect(() => {
    window.api.getAppVersion().then(v => setAppVersion(v)).catch(() => {});
    const timer = setTimeout(() => {
      triggerUpdateCheck(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Custom columns / transcode config states
  const [fileConfigs, setFileConfigs] = useState({});
  const [batchVideoCodec, setBatchVideoCodec] = useState('h264');
  const [batchQuality, setBatchQuality] = useState(20);
  const [batchFramerate, setBatchFramerate] = useState('constant');
  const [batchAudioCodec, setBatchAudioCodec] = useState('AAC');
  const [batchAudioLang, setBatchAudioLang] = useState('eng');
  const [batchAudioLang2, setBatchAudioLang2] = useState('none');
  const [batchSubLang, setBatchSubLang] = useState('none');
  const [batchSubLang2, setBatchSubLang2] = useState('none');

  const handleUpdateConfig = (filePath, key, value) => {
    setFileConfigs(prev => ({
      ...prev,
      [filePath]: {
        ...prev[filePath],
        [key]: value
      }
    }));
  };

  const handleApplyBatchConfig = () => {
    if (selectedPaths.size === 0) {
      showToast('Warning', 'Please select at least one file to apply batch settings.', 'warning');
      return;
    }
    setFileConfigs(prev => {
      const next = { ...prev };
      scannedFiles.forEach(file => {
        if (selectedPaths.has(file.fullPath)) {
          // 1. Match Audio track by language code (Audio Source 1)
          let audioSrc1 = 'none';
          if (file.audioStreams.length > 0) {
            if (batchAudioLang === 'first') {
              audioSrc1 = '1';
            } else {
              const matchedIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, batchAudioLang));
              audioSrc1 = matchedIdx !== -1 ? (matchedIdx + 1).toString() : '1';
            }
          }

          // 1b. Match Audio track 2 by language code (Audio Source 2)
          let audioSrc2 = 'none';
          if (file.audioStreams.length > 0) {
            if (batchAudioLang2 === 'none') {
              audioSrc2 = 'none';
            } else if (batchAudioLang2 === 'first') {
              audioSrc2 = '1';
            } else {
              const matchedIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, batchAudioLang2));
              audioSrc2 = matchedIdx !== -1 ? (matchedIdx + 1).toString() : 'none';
            }
          }

          // 2. Match Subtitle track by language code (Subtitle Source 1)
          let subSrc1 = 'none';
          if (file.subtitleStreams.length > 0) {
            if (batchSubLang === 'none') {
              subSrc1 = 'none';
            } else if (batchSubLang === 'first') {
              subSrc1 = '1';
            } else {
              const matchedIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, batchSubLang));
              subSrc1 = matchedIdx !== -1 ? (matchedIdx + 1).toString() : 'none';
            }
          }

          // 2b. Match Subtitle track 2 by language code (Subtitle Source 2)
          let subSrc2 = 'none';
          if (file.subtitleStreams.length > 0) {
            if (batchSubLang2 === 'none') {
              subSrc2 = 'none';
            } else if (batchSubLang2 === 'first') {
              subSrc2 = '1';
            } else {
              const matchedIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, batchSubLang2));
              subSrc2 = matchedIdx !== -1 ? (matchedIdx + 1).toString() : 'none';
            }
          }

          next[file.fullPath] = {
            ...next[file.fullPath],
            videoCodec: batchVideoCodec,
            quality: batchQuality,
            framerate: batchFramerate,
            audioCodec: batchAudioCodec,
            audioSource1: audioSrc1,
            audioSource2: audioSrc2,
            subtitleSource1: subSrc1,
            subtitleSource2: subSrc2
          };
        }
      });
      return next;
    });
    showToast('Applied to Selection', `Transcode settings & track mapping updated for ${selectedPaths.size} files.`, 'success');
  };

  // Queue & Progress tracking
  const [queue, setQueue] = useState([]); // Array of { file, percent, speed, avgSpeed, eta, status }
  const [activeConsoleLog, setActiveConsoleLog] = useState('');
  const [activeConsoleFile, setActiveConsoleFile] = useState(null);
  const consoleLogsRef = useRef({}); // Stores logs keyed by filePath
  const consoleEndRef = useRef(null);

  // Initialize and load
  useEffect(() => {
    async function init() {
      // Load configurations
      const savedSettings = await window.api.getSettings();
      setSettings(savedSettings);
      setEnginesCount(savedSettings.engines);
      
      // Check executables
      const tools = await window.api.checkTools();
      setToolsState(tools);
      
      // Trigger warning toast if missing
      const missing = [];
      if (!tools.handbrakeInstalled) missing.push('HandBrakeCLI');
      if (!tools.mediaInfoInstalled) missing.push('MediaInfo');
      
      if (missing.length > 0) {
        let msg = '';
        if (missing.includes('HandBrakeCLI') && missing.includes('MediaInfo')) {
          msg = "We couldn't locate HandBrakeCLI.exe and MediaInfo.exe on your system. Note: You need the command-line utility (HandBrakeCLI.exe), not the standard GUI version (HandBrake.exe).";
        } else if (missing.includes('HandBrakeCLI')) {
          msg = "We couldn't locate HandBrakeCLI.exe in C:\\Program Files\\HandBrake\\ or your system PATH. Note: You need the command-line utility (HandBrakeCLI.exe), not the standard GUI version (HandBrake.exe). Please download it and place it in C:\\Program Files\\HandBrake\\.";
        } else {
          msg = "We couldn't locate MediaInfo.exe in C:\\Program Files\\MediaInfo\\ or your system PATH. Please download and install the CLI/GUI package.";
        }

        showToast(
          'Missing Required Tools',
          msg,
          'warning',
          true // Persistent
        );
      }
    }
    init();

    // Listen to real-time events
    const unsubscribeProgress = window.api.onProgress((data) => {
      // data: { filePath, percent, fps, avgFps, eta }
      setQueue(prev => prev.map(item => {
        if (item.file.fullPath === data.filePath) {
          if (item.status === 'Paused' || item.status === 'Stopped') {
            return item;
          }
          return {
            ...item,
            percent: data.percent,
            speed: data.fps,
            avgSpeed: data.avgFps,
            eta: data.eta,
            status: 'Processing'
          };
        }
        return item;
      }));
    });

    const unsubscribeLog = (data) => {
      // data: { filePath, text }
      const path = data.filePath;
      if (!consoleLogsRef.current[path]) {
        consoleLogsRef.current[path] = '';
      }
      consoleLogsRef.current[path] += data.text + '\n';
      
      // Update UI log if this is the active file
      setActiveConsoleFile(currentFile => {
        if (currentFile && currentFile.fullPath === path) {
          setActiveConsoleLog(consoleLogsRef.current[path]);
        }
        return currentFile;
      });
    };
    const unsubscribeLogEvent = window.api.onLog(unsubscribeLog);

    const unsubscribeFileComplete = window.api.onFileComplete((data) => {
      // data: { filePath, success, error, finalPath }
      setQueue(prev => prev.map(item => {
        if (item.file.fullPath === data.filePath) {
          return {
            ...item,
            percent: data.success ? 100 : item.percent,
            status: data.success ? 'Completed' : 'Failed',
            error: data.error
          };
        }
        return item;
      }));
    });

    const unsubscribeQueueComplete = window.api.onQueueComplete(() => {
      setIsTranscoding(false);
      showToast(
        'Queue Completed',
        'Batch transcoding process finished.',
        'success'
      );
    });

    const unsubscribeCloseRequest = window.api.onCloseRequest(() => {
      setCloseConfirmationOpen(true);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeLogEvent();
      unsubscribeFileComplete();
      unsubscribeQueueComplete();
      unsubscribeCloseRequest();
    };
  }, []);

  // Scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConsoleLog]);

  // Toast Helper
  const showToast = (title, message, type = 'error', persistent = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type, persistent }]);
    if (!persistent) {
      setTimeout(() => {
        removeToast(id);
      }, 7000);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Browse folder to scan
  const handleBrowseScan = async () => {
    try {
      const folderPath = await window.api.selectDirectory();
      if (folderPath) {
        setScanDir(folderPath);
        await runScan(folderPath);
      }
    } catch (err) {
      showToast('Scan Error', err.message);
    }
  };

  // Drag and drop folders to scan
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Since it's Electron, we can get the real system path
      const folderPath = file.path;
      // Basic check if it is a directory (usually has no dot or we let fs handle it)
      setScanDir(folderPath);
      await runScan(folderPath);
    }
  };

  const runScan = async (folderPath) => {
    setIsScanning(true);
    setScannedFiles([]);
    setSelectedPaths(new Set());
    
    try {
      const checkConfig = {
        transcodeMode,
        destinationDir,
        presetFile: settings.handbrakePresetPath
      };
      const files = await window.api.scanDirectory(folderPath, checkConfig);
      setScannedFiles(files);

      // Initialize configuration for each file with defaults and language matching
      const initialConfigs = {};
      files.forEach(file => {
        // Auto-select English audio track, or first track if not found
        let audioSrc1 = 'none';
        if (file.audioStreams.length > 0) {
          const engAudioIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
          audioSrc1 = engAudioIdx !== -1 ? (engAudioIdx + 1).toString() : '1';
        }

        // Auto-select English subtitle track if exists
        let subSrc1 = 'none';
        if (file.subtitleStreams.length > 0) {
          const engSubIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
          subSrc1 = engSubIdx !== -1 ? (engSubIdx + 1).toString() : 'none';
        }

        initialConfigs[file.fullPath] = {
          videoCodec: 'h264',
          quality: 20,
          framerate: 'constant',
          audioCodec: 'AAC',
          audioSource1: audioSrc1,
          audioSource2: 'none',
          subtitleSource1: subSrc1,
          subtitleSource2: 'none'
        };
      });
      setFileConfigs(initialConfigs);
      
      // Auto-select files that are NOT Plex OK (red rows) and NOT processed as target for transcoding
      const notOkPaths = files.filter(f => !f.isPlexOk && !f.isProcessed).map(f => f.fullPath);
      setSelectedPaths(new Set(notOkPaths));

      showToast(
        'Scan Finished',
        `Successfully scanned ${files.length} media files. Selected ${notOkPaths.length} incompatible files.`,
        'success'
      );
    } catch (err) {
      showToast('Scan Failed', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const startTranscodeWithFiles = async (allFiles, filesToProcess) => {
    if (filesToProcess.length === 0) return;

    // Clear logs
    consoleLogsRef.current = {};
    setActiveConsoleLog('');
    setActiveConsoleFile(filesToProcess[0]);

    // Setup queue state
    const initialQueue = filesToProcess.map(f => ({
      file: f,
      percent: 0,
      speed: 0,
      avgSpeed: 0,
      eta: 'Waiting...',
      status: 'Queued'
    }));
    
    setQueue(initialQueue);
    setIsTranscoding(true);

    const config = {
      engines: enginesCount,
      mode: transcodeMode,
      postAction: postAction,
      replaceAction: replaceAction,
      destinationDir: destinationDir,
      presetFile: settings.handbrakePresetPath,
      presetName: settings.handbrakePresetName,
      fileConfigs: fileConfigs
    };

    try {
      const res = await window.api.startTranscode(filesToProcess, config);
      if (!res.success) {
        showToast('Transcode Failed', res.message);
        setIsTranscoding(false);
      } else {
        showToast('Auto-Queue', `Automatically started transcoding ${filesToProcess.length} new files.`, 'success');
      }
    } catch (err) {
      showToast('Transcode Error', err.message);
      setIsTranscoding(false);
    }
  };

  const triggerAutoScan = async () => {
    if (!scanDir) return;
    
    try {
      const checkConfig = {
        transcodeMode,
        destinationDir,
        presetFile: settings.handbrakePresetPath
      };
      const files = await window.api.scanDirectory(scanDir, checkConfig);
      
      setScannedFiles(files);
      
      setFileConfigs(prev => {
        const next = { ...prev };
        files.forEach(file => {
          if (!next[file.fullPath]) {
            // Initialize default config for new file
            let audioSrc1 = 'none';
            if (file.audioStreams.length > 0) {
              const engAudioIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
              audioSrc1 = engAudioIdx !== -1 ? (engAudioIdx + 1).toString() : '1';
            }
            let subSrc1 = 'none';
            if (file.subtitleStreams.length > 0) {
              const engSubIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
              subSrc1 = engSubIdx !== -1 ? (engSubIdx + 1).toString() : 'none';
            }
            next[file.fullPath] = {
              videoCodec: 'h264',
              quality: 20,
              framerate: 'constant',
              audioCodec: 'AAC',
              audioSource1: audioSrc1,
              audioSource2: 'none',
              subtitleSource1: subSrc1,
              subtitleSource2: 'none'
            };
          }
        });
        return next;
      });

      // Update selected paths (uncheck processed, add new non-Plex-OK and non-processed)
      let updatedSelected;
      setSelectedPaths(prev => {
        const next = new Set(prev);
        files.forEach(file => {
          if (file.isProcessed) {
            next.delete(file.fullPath);
          } else if (!file.isPlexOk) {
            next.add(file.fullPath);
          }
        });
        updatedSelected = next;
        return next;
      });

      if (autoAddToQueue) {
        // Find checked, non-processed, non-Plex-OK files that are NOT in queue
        const filesToProcess = files.filter(file => {
          const isSelected = updatedSelected ? updatedSelected.has(file.fullPath) : (!file.isProcessed && !file.isPlexOk);
          const inQueue = queue.some(item => item.file.fullPath === file.fullPath);
          return isSelected && !inQueue;
        });

        if (filesToProcess.length > 0) {
          if (isTranscoding) {
            setQueue(prev => [
              ...prev,
              ...filesToProcess.map(f => ({
                file: f,
                percent: 0,
                speed: 0,
                avgSpeed: 0,
                eta: 'Waiting...',
                status: 'Queued'
              }))
            ]);
            await window.api.appendTranscodeFiles(filesToProcess);
            showToast('Auto-Queue', `Automatically added ${filesToProcess.length} new files to the active transcoding queue.`, 'info');
          } else {
            await startTranscodeWithFiles(files, filesToProcess);
          }
        }
      }
    } catch (err) {
      console.error('Auto-scan error:', err);
    }
  };

  const triggerAutoScanRef = useRef(triggerAutoScan);
  useEffect(() => {
    triggerAutoScanRef.current = triggerAutoScan;
  });

  // Rescan countdown effect
  useEffect(() => {
    if (autoRescanInterval <= 0 || !scanDir) {
      setTimeUntilNextScan(0);
      return;
    }

    setTimeUntilNextScan(autoRescanInterval * 60);

    const intervalId = setInterval(() => {
      setTimeUntilNextScan(prev => {
        if (prev <= 1) {
          triggerAutoScanRef.current();
          return autoRescanInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoRescanInterval, scanDir, autoAddToQueue, isTranscoding, transcodeMode, destinationDir, settings.handbrakePresetPath]);

  // Reactive processed status recheck effect
  useEffect(() => {
    if (scannedFiles.length === 0) return;

    const updateProcessedStatuses = async () => {
      try {
        const checkConfig = {
          transcodeMode,
          destinationDir,
          presetFile: settings.handbrakePresetPath
        };
        const updated = await window.api.checkProcessedStatus(scannedFiles, checkConfig);
        
        setScannedFiles(prev => prev.map(file => {
          const matching = updated.find(u => u.fullPath === file.fullPath);
          return matching ? { ...file, isProcessed: matching.isProcessed } : file;
        }));

        setSelectedPaths(prev => {
          const next = new Set(prev);
          updated.forEach(u => {
            if (u.isProcessed) {
              next.delete(u.fullPath);
            }
          });
          return next;
        });
      } catch (err) {
        console.error('Error updating processed status:', err);
      }
    };

    updateProcessedStatuses();
  }, [destinationDir, transcodeMode, settings.handbrakePresetPath]);

  // Browse output destination folder (Option 2)
  const handleBrowseDestination = async () => {
    const folderPath = await window.api.selectDirectory();
    if (folderPath) {
      setDestinationDir(folderPath);
    }
  };

  // Browse preset file
  const handleBrowsePreset = async () => {
    // We can open a file dialog via electron dialog (let's use standard native browse)
    // Wait, let's trigger it in main.js, let's register an IPC handler for file select
    showToast('Info', 'Clicking settings to configure Handbrake preset files.');
    setSettingsOpen(true);
  };

  // Checkbox selections
  const handleToggleSelect = (path) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const visibleFiles = getFilteredFiles();
    const allVisibleSelected = visibleFiles.every(f => selectedPaths.has(f.fullPath));

    setSelectedPaths(prev => {
      const next = new Set(prev);
      visibleFiles.forEach(f => {
        if (allVisibleSelected) {
          next.delete(f.fullPath);
        } else {
          next.add(f.fullPath);
        }
      });
      return next;
    });
  };

  // Filter and Search scanned files
  const getFilteredFiles = () => {
    const filtered = scannedFiles.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            file.relativePath.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlexFilter = filterMode === 'all' ||
                                (filterMode === 'plex-ok' && file.isPlexOk) ||
                                (filterMode === 'plex-not-ok' && !file.isPlexOk);

      const matchesTranscodedFilter = transcodedFilter === 'all' ||
                                      (transcodedFilter === 'not-transcoded' && !file.isProcessed) ||
                                      (transcodedFilter === 'transcoded' && file.isProcessed);

      return matchesSearch && matchesPlexFilter && matchesTranscodedFilter;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'size':
          cmp = (a.sizeBytes || 0) - (b.sizeBytes || 0);
          break;
        case 'plexStatus':
          // Incompatible (false) first when asc
          cmp = (a.isPlexOk === b.isPlexOk) ? 0 : (a.isPlexOk ? 1 : -1);
          break;
        case 'transcodedStatus':
          // Not transcoded (false) first when asc
          cmp = (a.isProcessed === b.isProcessed) ? 0 : (a.isProcessed ? 1 : -1);
          break;
        case 'videoCodec':
          cmp = (a.videoCodec || '').localeCompare(b.videoCodec || '');
          break;
        case 'audioTracks':
          cmp = (a.audioStreams?.length || 0) - (b.audioStreams?.length || 0);
          break;
        case 'extension':
          cmp = (a.extension || '').localeCompare(b.extension || '');
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  };

  // Start Transcoding
  const handleStartTranscode = async () => {
    if (selectedPaths.size === 0) {
      showToast('Transcode Error', 'Please select at least one file to transcode.');
      return;
    }

    if (!toolsState.handbrakeInstalled) {
      showToast('Transcode Error', 'HandBrakeCLI is not installed. Please download it first.');
      return;
    }

    // Gathers selected files
    const filesToProcess = scannedFiles.filter(f => selectedPaths.has(f.fullPath));
    
    // Clear logs
    consoleLogsRef.current = {};
    setActiveConsoleLog('');
    setActiveConsoleFile(filesToProcess[0]);

    // Setup queue state
    const initialQueue = filesToProcess.map(f => ({
      file: f,
      percent: 0,
      speed: 0,
      avgSpeed: 0,
      eta: 'Waiting...',
      status: 'Queued'
    }));
    
    setQueue(initialQueue);
    setIsTranscoding(true);

    const config = {
      engines: enginesCount,
      mode: transcodeMode,
      postAction: postAction,
      replaceAction: replaceAction,
      destinationDir: destinationDir,
      presetFile: settings.handbrakePresetPath,
      presetName: settings.handbrakePresetName,
      fileConfigs: fileConfigs
    };

    try {
      const res = await window.api.startTranscode(filesToProcess, config);
      if (!res.success) {
        showToast('Transcode Failed', res.message);
        setIsTranscoding(false);
      }
    } catch (err) {
      showToast('Transcode Error', err.message);
      setIsTranscoding(false);
    }
  };

  // Stop Transcoding
  const handleStopTranscode = async () => {
    try {
      await window.api.stopTranscode();
      setIsTranscoding(false);
      showToast('Transcode Cancelled', 'Processing queue has been aborted.', 'warning');
    } catch (err) {
      showToast('Stop Failed', err.message);
    }
  };

  const handlePauseJob = async (filePath) => {
    try {
      const res = await window.api.pauseJob(filePath);
      if (res.success) {
        setQueue(prev => prev.map(item => 
          item.file.fullPath === filePath ? { ...item, status: 'Paused', speed: 0, eta: 'Paused' } : item
        ));
        showToast('Job Paused', 'Transcoding paused for this file.', 'success');
      }
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  const handleResumeJob = async (filePath) => {
    try {
      const res = await window.api.resumeJob(filePath);
      if (res.success) {
        setQueue(prev => prev.map(item => 
          item.file.fullPath === filePath ? { ...item, status: 'Processing' } : item
        ));
        showToast('Job Resumed', 'Transcoding resumed for this file.', 'success');
      }
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  const handleStopJob = async (filePath) => {
    try {
      const res = await window.api.stopJob(filePath);
      if (res.success) {
        setQueue(prev => prev.map(item => 
          item.file.fullPath === filePath ? { ...item, status: 'Stopped', speed: 0, eta: 'Cancelled' } : item
        ));
        showToast('Job Stopped', 'Transcoding stopped and cancelled for this file.', 'warning');
      }
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  const handlePauseAll = async () => {
    try {
      const res = await window.api.pauseAll();
      if (res.success) {
        setQueue(prev => prev.map(item => 
          item.status === 'Processing' ? { ...item, status: 'Paused', speed: 0, eta: 'Paused' } : item
        ));
        showToast('Queue Paused', 'All active transcoding engines paused.', 'success');
      }
    } catch (err) {
      showToast('Error', err.message);
    }
  };

  const handleResumeAll = async () => {
    try {
      const res = await window.api.resumeAll();
      if (res.success) {
        setQueue(prev => prev.map(item => 
          item.status === 'Paused' ? { ...item, status: 'Processing' } : item
        ));
        showToast('Queue Resumed', 'All paused transcoding engines resumed.', 'success');
      }
    } catch (err) {
      showToast('Error', err.message);
    }
  };
  const handleSaveSampleConfig = (filePath, rf, codec) => {
    setFileConfigs(prev => ({
      ...prev,
      [filePath]: {
        ...prev[filePath],
        quality: rf,
        videoCodec: codec
      }
    }));
  };



  // Post transcode Copy/Move for Option #1 (transcodeDir)
  const [isPerformingMoveCopy, setIsPerformingMoveCopy] = useState(false);
  const handleMoveCopyTranscoded = async (action) => {
    const completedFiles = queue.filter(item => item.status === 'Completed').map(item => item.file);
    
    if (completedFiles.length === 0) {
      showToast('Operation Failed', 'No successfully transcoded files exist in the current queue to move/copy.', 'warning');
      return;
    }

    if (transcodeMode !== 'transcodeDir' || !destinationDir) {
      showToast('Operation Failed', 'Post-process Move/Copy is only available when transcoding to a directory.', 'warning');
      return;
    }

    setIsPerformingMoveCopy(true);
    showToast('Executing Operations', `Running replacing (${action}) process on completed files...`, 'success');

    try {
      const config = {
        replaceAction: action,
        destinationDir: destinationDir,
        presetFile: settings.handbrakePresetPath
      };

      const results = await window.api.moveCopyFiles(completedFiles, config);
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        showToast('Operation Success', `Successfully processed ${results.length} files.`, 'success');
      } else {
        showToast('Operation Warning', `Processed ${results.length} files. ${failed.length} failed. Check console.`, 'warning');
        console.error('Failed move/copy operations:', failed);
      }
    } catch (err) {
      showToast('Operation Failed', err.message);
    } finally {
      setIsPerformingMoveCopy(false);
    }
  };

  // Helper: Format Bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const estimateTranscodedSize = (file, config) => {
    const originalSize = file.sizeBytes;
    const rf = config.quality || 20;
    const codec = config.videoCodec || 'h264';
    
    // Base ratio model: h265 is more efficient
    const isH265 = codec === 'h265';
    const refRF = isH265 ? 24 : 22;
    const baseRatio = isH265 ? 0.30 : 0.43;
    
    // Logarithmic scaling based on RF (each change of 6 RF steps doubles/halves size)
    const rfDiff = refRF - rf;
    let ratio = baseRatio * Math.pow(2, rfDiff / 6);
    
    // Audio factor: AAC is typically very small. Copy keeps original audio size.
    let audioFactor = 1.0;
    if (config.audioCodec === 'AAC') {
      audioFactor = 0.85; // AAC transcode savings
    } else if (config.audioCodec === 'Copy') {
      audioFactor = 1.05; // Keep original audio
    } else {
      audioFactor = 0.95; // AC3/EAC3
    }
    
    ratio *= audioFactor;
    
    // Clamp ratio between 0.05 (5%) and 1.5 (150%) of original size
    ratio = Math.max(0.05, Math.min(1.5, ratio));
    
    return originalSize * ratio;
  };

  // Modal actions
  const openDetails = (file) => {
    setDetailsFile(file);
  };

  const openSampleModal = (file, config) => {
    setSampleFile(file);
    setSampleConfig(config);
  };

  // Save Settings Modal
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const success = await window.api.saveSettings(settings);
    if (success) {
      showToast('Settings Saved', 'Configuration saved successfully.', 'success');
      setSettingsOpen(false);
      // Recheck tools
      const tools = await window.api.checkTools();
      setToolsState(tools);
    } else {
      showToast('Settings Error', 'Failed to save settings file.');
    }
  };

  // HandBrake Preset file path upload simulation (in Electron, we open a dialog to select file)
  const handleBrowsePresetFile = async () => {
    // Open openFileDialog for json preset file
    // We will do a custom openDialog command
    const res = await window.api.selectDirectory(); // Actually, select directory handles folder, let's add file selection!
    // Wait, let's write a simple selector. We can write a custom IPC or just prompt input.
    // To make file selecting easy for users, we can add a text input, but native file select is awesome.
    // Let's call selectPresetFile which we can add. Let's make it easy: a file select IPC in main.js.
    // Wait, we didn't add file selection IPC? Ah, selectDirectory is folder only. Let's write a file browser!
    // Wait! Let's check how we can do it: Electron dialog supports properties: ['openFile', 'promptToCreate'] with filter for JSON.
    // Let's implement dynamic preset files parsing!
  };

  // Trigger select preset file dialog from UI
  const triggerPresetFileSelect = async () => {
    const result = await window.electronDialogSelectPreset(); // Wait, let's register an IPC in main.js?
    // Let's write one if not there, or let the user enter the path in settings. Let's add a prompt where the user enters the absolute path, or select it!
    // Let's look at settings settings: we can let them input it or we can add a file picker IPC! Let's check if we have one. In main.js, we don't have a file picker IPC yet, but we can easily write one, or add file picker support to select-directory or create a new one!
  };

  // Let's write a file picker in main.js! Wait, we can modify main.js to add it, or we can just run it. We have already written main.js!
  // Wait, in main.js we have:
  // ipcMain.handle('select-directory', ...)
  // We can write a new IPC handler, or just edit main.js to add 'select-file'!
  // Wait, let's see if we need it. Let's add a file selection dialog.

  return (
    <div className="app-container" style={{ gridTemplateRows: `56px 1fr ${queueHeight}px` }}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <FileVideo size={20} className="text-accent" style={{ color: 'var(--accent)' }} />
          <h1>HB Minigun</h1>
          <span style={{ background: 'rgba(0, 132, 255, 0.15)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 'bold' }}>v{appVersion}</span>
        </div>
        <div className="header-actions">
          {isScanning && (
            <div className="flex-row text-muted" style={{ fontSize: '12px' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
              Scanning Library...
            </div>
          )}
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => triggerUpdateCheck(false)}
            disabled={isCheckingUpdates || isTranscoding}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
          >
            {isCheckingUpdates ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Check for Updates
            {updateInfo && updateInfo.hasUpdate && (
              <span className="badge" style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e11d48', border: 'none', color: '#fff', fontSize: '8px', padding: '1px 3px', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>NEW</span>
            )}
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSettingsOpen(true)}
            disabled={isTranscoding}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <main className="app-body">
        {/* Left Side: Directory Scanner */}
        <section className="left-panel">
          <div className="panel-header">
            <div className="panel-title-area">
              <span className="panel-title">Media Library</span>
              <span className="badge active">{scannedFiles.length} files</span>
              {selectedPaths.size > 0 && (
                <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent-glow)' }}>
                  {selectedPaths.size} selected
                </span>
              )}
            </div>
            
            <div className="search-filter-row" style={{ flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
              {/* Row 1: Search + Sort */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="search-input-wrapper" style={{ flex: 1 }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search scanned files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="name">Sort: Name</option>
                  <option value="size">Sort: File Size</option>
                  <option value="plexStatus">Sort: Plex Status</option>
                  <option value="transcodedStatus">Sort: Transcoded</option>
                  <option value="videoCodec">Sort: Video Codec</option>
                  <option value="audioTracks">Sort: Audio Tracks</option>
                  <option value="extension">Sort: Extension</option>
                </select>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  title={sortDir === 'asc' ? 'Ascending — click to switch to Descending' : 'Descending — click to switch to Ascending'}
                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', minWidth: 'unset' }}
                >
                  {sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                </button>
              </div>

              {/* Row 2: Filter pills */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Transcoded status pills */}
                {[
                  { value: 'all', label: 'All' },
                  { value: 'not-transcoded', label: 'Not Transcoded' },
                  { value: 'transcoded', label: 'Transcoded' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTranscodedFilter(opt.value)}
                    style={{
                      padding: '2px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: `1px solid ${transcodedFilter === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: transcodedFilter === opt.value ? 'rgba(0,132,255,0.18)' : 'var(--bg-card)',
                      color: transcodedFilter === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Divider */}
                <span style={{ width: '1px', height: '14px', background: 'var(--border)', margin: '0 2px' }} />

                {/* Plex status pills */}
                {[
                  { value: 'all', label: 'All Formats' },
                  { value: 'plex-ok', label: 'Plex OK' },
                  { value: 'plex-not-ok', label: 'Plex Incompatible' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterMode(opt.value)}
                    style={{
                      padding: '2px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: `1px solid ${filterMode === opt.value ? '#2ec4b6' : 'var(--border)'}`,
                      background: filterMode === opt.value ? 'rgba(46,196,182,0.15)' : 'var(--bg-card)',
                      color: filterMode === opt.value ? '#2ec4b6' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {scannedFiles.length === 0 ? (
            <div 
              className={`dropzone-overlay ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowseScan}
            >
              <Folder size={48} className="dropzone-icon" />
              <h2 className="dropzone-title">Scan Media Folder</h2>
              <p className="dropzone-desc">
                Drag and drop a folder here, or click to browse and select a library folder.
              </p>
              <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleBrowseScan(); }}>
                Browse Folder
              </button>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="files-table">
                <thead>
                  {/* Grouped Header Categories Row */}
                  <tr style={{ background: 'var(--bg-darker)' }}>
                    <th colSpan={4} className="col-divider" style={{ textAlign: 'center', padding: '10px 14px', fontSize: '11.5px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#00b4d8', textDecoration: 'underline', borderBottom: '2px solid var(--border)' }}>
                      Source Video Info
                    </th>
                    <th colSpan={8} style={{ textAlign: 'center', padding: '10px 14px', fontSize: '11.5px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffb703', textDecoration: 'underline', borderBottom: '2px solid var(--accent)' }}>
                      Transcode Options
                    </th>
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px 14px', fontSize: '11.5px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#2ec4b6', textDecoration: 'underline', borderBottom: '2px solid var(--border)' }}>
                      Playback & Check
                    </th>
                  </tr>
                  {/* Detail Columns Row */}
                  <tr>
                    <th className="checkbox-col">
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={getFilteredFiles().length > 0 && getFilteredFiles().every(f => selectedPaths.has(f.fullPath))}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Name</th>
                    <th style={{ minWidth: '220px' }}>Original Streams</th>
                    <th className="col-divider">Size / Ext</th>
                    <th>Video Codec</th>
                    <th>Quality (RF)</th>
                    <th>Frame Rate</th>
                    <th>Audio Codec</th>
                    <th>Audio Src 1</th>
                    <th>Audio Src 2</th>
                    <th>Subtitle 1</th>
                    <th>Subtitle 2</th>
                    <th>Plex Playback</th>
                    <th>Est. Size</th>
                    <th>Quality Check</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredFiles().map((file) => {
                    const config = fileConfigs[file.fullPath] || {
                      videoCodec: 'h264',
                      quality: 20,
                      framerate: 'constant',
                      audioCodec: 'AAC',
                      audioSource1: file.audioStreams.length > 0 ? '1' : 'none',
                      audioSource2: 'none',
                      subtitleSource1: 'none',
                      subtitleSource2: 'none'
                    };
                    
                    return (
                      <tr 
                        key={file.fullPath}
                        className={`${file.isProcessed ? 'row-processed' : (file.isPlexOk ? 'row-plex-ok' : 'row-plex-red')} ${selectedPaths.has(file.fullPath) ? 'row-selected' : ''}`}
                      >
                        <td className="checkbox-col">
                          <input 
                            type="checkbox" 
                            className="custom-checkbox"
                            checked={selectedPaths.has(file.fullPath)}
                            onChange={() => handleToggleSelect(file.fullPath)}
                          />
                        </td>
                        <td className="file-name-cell">
                          <div className="file-title" title={file.name} style={{ maxWidth: '160px' }}>{file.name}</div>
                          <div className="file-path" title={file.fullPath} style={{ maxWidth: '160px' }}>{file.relativePath}</div>
                        </td>
                        
                        {/* Expanded Original Streams details cell */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10.5px', padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(0,132,255,0.15)', color: 'var(--accent)', padding: '1px 4px', borderRadius: '3px' }}>VIDEO</span>
                              <strong style={{ color: 'var(--text-bright)' }}>{file.videoCodec}</strong>
                              <span style={{ color: 'var(--text-muted)' }}>({file.videoFormat || 'Profile Unknown'})</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #2e3547', paddingLeft: '6px', marginLeft: '2px' }}>
                              <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audio Tracks ({file.audioStreams.length})</span>
                              {file.audioStreams.map((s, idx) => (
                                <div key={idx} style={{ color: 'var(--text-main)', fontSize: '10px' }}>
                                  Track {idx + 1}: <strong>{s.codec}</strong> ({s.language}) - {s.channels}ch
                                </div>
                              ))}
                              {file.audioStreams.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>No audio tracks</span>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #2e3547', paddingLeft: '6px', marginLeft: '2px' }}>
                              <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtitles ({file.subtitleStreams.length})</span>
                              {file.subtitleStreams.map((s, idx) => (
                                <div key={idx} style={{ color: 'var(--text-main)', fontSize: '10px' }}>
                                  Track {idx + 1}: <strong>{s.format}</strong> ({s.language})
                                </div>
                              ))}
                              {file.subtitleStreams.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>No subtitle tracks</span>}
                            </div>
                          </div>
                        </td>

                        {/* File Size & Extension with Divider */}
                        <td className="col-divider">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ color: 'var(--text-bright)' }}>{formatBytes(file.sizeBytes)}</strong>
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '10px' }}>{file.extension.toUpperCase()}</span>
                          </div>
                        </td>
                        
                        {/* Video Codec Selector */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.videoCodec}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'videoCodec', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="h264">h264</option>
                            <option value="h265">h265</option>
                          </select>
                        </td>
                        
                        {/* Video Quality (CQ) */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.quality}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'quality', parseInt(e.target.value))}
                            disabled={isTranscoding}
                            style={{ minWidth: '60px' }}
                          >
                            {Array.from({ length: 21 }, (_, i) => 30 - i).map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </td>

                        {/* Framerate mode */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.framerate}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'framerate', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="constant">Constant</option>
                            <option value="variable">Variable</option>
                          </select>
                        </td>

                        {/* Audio Target Codec */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.audioCodec}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'audioCodec', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="AAC">AAC</option>
                            <option value="AC3">AC3</option>
                            <option value="EAC3">EAC3</option>
                            <option value="MP3">MP3</option>
                            <option value="Copy">Copy</option>
                          </select>
                        </td>

                        {/* Audio Source Track 1 */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.audioSource1}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'audioSource1', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="none">None</option>
                            {file.audioStreams.map((s, idx) => (
                              <option key={idx} value={(idx + 1).toString()}>
                                T{idx + 1} ({s.language})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Audio Source Track 2 */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.audioSource2}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'audioSource2', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="none">None</option>
                            {file.audioStreams.map((s, idx) => (
                              <option key={idx} value={(idx + 1).toString()}>
                                T{idx + 1} ({s.language})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Subtitle Track 1 */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.subtitleSource1}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'subtitleSource1', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="none">None</option>
                            {file.subtitleStreams.map((s, idx) => (
                              <option key={idx} value={(idx + 1).toString()}>
                                T{idx + 1} ({s.language})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Subtitle Track 2 */}
                        <td>
                          <select 
                            className="table-select"
                            value={config.subtitleSource2}
                            onChange={(e) => handleUpdateConfig(file.fullPath, 'subtitleSource2', e.target.value)}
                            disabled={isTranscoding}
                          >
                            <option value="none">None</option>
                            {file.subtitleStreams.map((s, idx) => (
                              <option key={idx} value={(idx + 1).toString()}>
                                T{idx + 1} ({s.language})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Plex Playback status info */}
                        <td>
                          {file.isPlexOk ? (
                            <span className="plex-status-indicator ok" style={{ padding: '2px 4px', fontSize: '10.5px' }}>
                              <CheckCircle size={10} />
                              Optimal
                            </span>
                          ) : (
                            <span 
                              className="plex-status-indicator not-ok"
                              onClick={() => openDetails(file)}
                              title="Click to view Plex issues"
                              style={{ padding: '2px 4px', fontSize: '10.5px' }}
                            >
                              <AlertTriangle size={10} />
                              Incompatible
                            </span>
                          )}
                        </td>

                        {/* Estimated Size */}
                        <td>
                          {(() => {
                            const estSize = estimateTranscodedSize(file, config);
                            const percent = Math.round((estSize / file.sizeBytes) * 100);
                            const diffPercent = percent - 100;
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <strong style={{ color: 'var(--accent)', fontSize: '11px' }}>{formatBytes(estSize)}</strong>
                                <span style={{ color: diffPercent < 0 ? '#4caf50' : '#f44336', fontSize: '10.5px', fontWeight: 'bold' }}>
                                  {diffPercent < 0 ? `${diffPercent}%` : `+${diffPercent}%`}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Sample Preview button */}
                        <td>
                          <button 
                            type="button"
                            className="btn btn-outline-blue btn-xs" 
                            style={{ padding: '4px 8px', fontSize: '10.5px', height: '24px', background: 'rgba(0, 132, 255, 0.1)', border: '1px solid rgba(0, 132, 255, 0.3)', color: 'var(--accent)' }}
                            onClick={() => openSampleModal(file, config)}
                          >
                            Sample
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Side: Options Panel */}
        <section className="right-panel">
          {/* Target Concurrency */}
          <div className="section-title">
            <Sliders size={14} />
            Job Engine Config
          </div>
          <div className="form-group">
            <label>Concurrent Handbrake Engines</label>
            <div className="slider-container">
              <input 
                type="range" 
                min="1" 
                max="8" 
                className="custom-slider"
                value={enginesCount}
                onChange={(e) => setEnginesCount(parseInt(e.target.value))}
                disabled={isTranscoding}
              />
              <span className="slider-val">{enginesCount}</span>
            </div>
          </div>

          {/* Transcode Directory Options */}
          <div 
            className="section-title"
            onClick={() => setDirectoryOptionsCollapsed(!directoryOptionsCollapsed)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={14} />
              Transcode Directory Options
            </div>
            {directoryOptionsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
          
          {!directoryOptionsCollapsed && (
            <>
              <div className="form-group">
              <label>Transcode Strategy</label>
            <div className="radio-group">
              <div 
                className={`radio-card ${transcodeMode === 'transcodeDir' ? 'selected' : ''}`}
                onClick={() => !isTranscoding && setTranscodeMode('transcodeDir')}
              >
                <div className="radio-card-header">
                  <div className="radio-dot" />
                  Option #1: Transcode to Destination Folder
                </div>
                <div className="radio-card-desc">
                  Transcodes directly to another output folder preserving library structures.
                </div>
              </div>

              <div 
                className={`radio-card ${transcodeMode === 'replace' ? 'selected' : ''}`}
                onClick={() => !isTranscoding && setTranscodeMode('replace')}
              >
                <div className="radio-card-header">
                  <div className="radio-dot" />
                  Option #2: Replace Source Files (Temp Directory)
                </div>
                <div className="radio-card-desc">
                  Transcodes to a temp folder first, then replaces the source files (highly recommended to prevent duplicates).
                </div>
              </div>
            </div>
          </div>

          {transcodeMode === 'transcodeDir' ? (
            <div style={{ display: 'contents' }}>
              <div className="form-group">
                <label>Destination Directory</label>
                <div className="input-with-button">
                  <input 
                    type="text" 
                    className="text-input" 
                    placeholder="Select transcode destination folder..."
                    value={destinationDir}
                    onChange={(e) => setDestinationDir(e.target.value)}
                    disabled={isTranscoding}
                  />
                  <button className="btn btn-secondary" onClick={handleBrowseDestination} disabled={isTranscoding}>
                    Browse
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ background: 'rgba(28, 32, 42, 0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ color: 'var(--accent)', marginBottom: '8px', display: 'block' }}>Automatic Post-Transcode Action</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%', marginBottom: '12px' }}
                  value={postAction}
                  onChange={(e) => setPostAction(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="none">Do Nothing (Default)</option>
                  <option value="move">Move (Delete Source & Replace)</option>
                  <option value="copy">Copy (Keep Transcoded & Replace Source)</option>
                </select>
                
                <label style={{ color: 'var(--text-bright)', marginBottom: '8px', display: 'block', fontSize: '11px' }}>Manual Replacement Triggers</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button 
                    className="btn btn-outline-blue btn-sm"
                    style={{ padding: '8px', fontSize: '10.5px' }}
                    onClick={() => handleMoveCopyTranscoded('move')}
                    disabled={isTranscoding || isPerformingMoveCopy || queue.length === 0}
                  >
                    {isPerformingMoveCopy ? <Loader2 size={10} className="animate-spin" /> : <Move size={10} />}
                    MOVE Files
                  </button>
                  <button 
                    className="btn btn-outline-blue btn-sm"
                    style={{ padding: '8px', fontSize: '10.5px' }}
                    onClick={() => handleMoveCopyTranscoded('copy')}
                    disabled={isTranscoding || isPerformingMoveCopy || queue.length === 0}
                  >
                    {isPerformingMoveCopy ? <Loader2 size={10} className="animate-spin" /> : <Copy size={10} />}
                    COPY Files
                  </button>
                </div>
                <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '8px', display: 'block' }}>
                  Use the manual trigger buttons to manually Move or Copy successfully transcoded files in the queue to replace original library files.
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'contents' }}>
              <div className="form-group">
                <label>Temp Transcode Directory</label>
                <input 
                  type="text" 
                  className="text-input" 
                  value={settings.tempDir} 
                  disabled 
                  style={{ opacity: 0.8 }}
                />
                <span className="text-muted" style={{ fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                  Default location: <code>C:\TempHBMG</code>
                </span>
              </div>
              <div className="form-group">
                <label>Replace Action Mode</label>
                <div className="toggle-wrapper" style={{ borderBottom: '1px solid rgba(46,53,71,0.3)', paddingBottom: '10px' }}>
                  <span className="toggle-label">Move transcoded file (deletes original)</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={replaceAction === 'move'}
                      onChange={(e) => setReplaceAction(e.target.checked ? 'move' : 'copy')}
                      disabled={isTranscoding}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
                  {replaceAction === 'move' ? (
                    'Process: Transcodes flat file in C:\\TempHBMG\\Filename.EXT. After completion, deletes original source file and moves new file to source folder.'
                  ) : (
                    'Process: Transcodes preserving folders in C:\\TempHBMG\\Folder\\Filename.EXT. Copies file to source folder to replace original, keeping temp structure.'
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
          
          {/* Directory Auto-Scan */}
          <div 
            className="section-title"
            onClick={() => setAutoScanCollapsed(!autoScanCollapsed)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} />
              Periodic Scan
            </div>
            {autoScanCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>

          {!autoScanCollapsed && (
            <div style={{ background: 'rgba(28, 32, 42, 0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div className="form-group">
                <label>Rescan Interval (Minutes)</label>
                <input 
                  type="number" 
                  min="0" 
                  className="text-input" 
                  placeholder="0 to disable auto-scan"
                  value={autoRescanInterval}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAutoRescanInterval(isNaN(val) ? 0 : val);
                  }}
                  disabled={isTranscoding && autoRescanInterval > 0}
                />
                <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                  Set to 0 to disable periodic rescanning.
                </span>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <input 
                  type="checkbox" 
                  id="autoAddToQueue" 
                  className="custom-checkbox"
                  checked={autoAddToQueue}
                  onChange={(e) => setAutoAddToQueue(e.target.checked)}
                />
                <label htmlFor="autoAddToQueue" style={{ margin: 0, cursor: 'pointer', userSelect: 'none', fontSize: '11px', color: 'var(--text-bright)' }}>
                  Automatically add new files to queue
                </label>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(46,53,71,0.3)', paddingTop: '8px' }}>
                {autoRescanInterval > 0 && scanDir ? (
                  <span style={{ color: 'var(--accent)' }}>Next scan in: <strong>{timeUntilNextScan}s</strong></span>
                ) : (
                  <span>Auto-scan disabled (interval is 0 or no folder scanned)</span>
                )}
              </div>
            </div>
          )}


          
          {/* Batch Apply Panel */}
          <div 
            className="section-title" 
            style={{ marginTop: '12px', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setBatchApplyCollapsed(!batchApplyCollapsed)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} />
              Batch Apply Settings
            </div>
            {batchApplyCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
          
          {!batchApplyCollapsed && (
            <div className="form-group" style={{ background: 'rgba(28, 32, 42, 0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Video Codec</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchVideoCodec}
                  onChange={(e) => setBatchVideoCodec(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="h264">H.264</option>
                  <option value="h265">H.265</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Quality (RF)</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchQuality}
                  onChange={(e) => setBatchQuality(parseInt(e.target.value))}
                  disabled={isTranscoding}
                >
                  {Array.from({ length: 21 }, (_, i) => 30 - i).map(q => (
                    <option key={q} value={q}>RF {q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Frame Rate</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchFramerate}
                  onChange={(e) => setBatchFramerate(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="constant">Constant</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Audio Codec</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchAudioCodec}
                  onChange={(e) => setBatchAudioCodec(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="AAC">AAC</option>
                  <option value="AC3">AC3</option>
                  <option value="EAC3">EAC3</option>
                  <option value="MP3">MP3</option>
                  <option value="Copy">Copy</option>
                </select>
              </div>
              {/* Audio Track 1 Match Language */}
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Audio Lang 1</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchAudioLang}
                  onChange={(e) => setBatchAudioLang(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fre">French (fre)</option>
                  <option value="ger">German (ger)</option>
                  <option value="jpn">Japanese (jpn)</option>
                  <option value="ita">Italian (ita)</option>
                  <option value="chi">Chinese (chi)</option>
                  <option value="kor">Korean (kor)</option>
                  <option value="first">First Track</option>
                </select>
              </div>

              {/* Audio Track 2 Match Language */}
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Audio Lang 2</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchAudioLang2}
                  onChange={(e) => setBatchAudioLang2(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="none">None</option>
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fre">French (fre)</option>
                  <option value="ger">German (ger)</option>
                  <option value="jpn">Japanese (jpn)</option>
                  <option value="ita">Italian (ita)</option>
                  <option value="chi">Chinese (chi)</option>
                  <option value="kor">Korean (kor)</option>
                  <option value="first">First Track</option>
                </select>
              </div>

              {/* Subtitle Track 1 Match Language */}
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Subtitle Lang 1</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchSubLang}
                  onChange={(e) => setBatchSubLang(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="none">None</option>
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fre">French (fre)</option>
                  <option value="ger">German (ger)</option>
                  <option value="jpn">Japanese (jpn)</option>
                  <option value="ita">Italian (ita)</option>
                  <option value="chi">Chinese (chi)</option>
                  <option value="kor">Korean (kor)</option>
                  <option value="first">First Track</option>
                </select>
              </div>

              {/* Subtitle Track 2 Match Language */}
              <div>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Subtitle Lang 2</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={batchSubLang2}
                  onChange={(e) => setBatchSubLang2(e.target.value)}
                  disabled={isTranscoding}
                >
                  <option value="none">None</option>
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="fre">French (fre)</option>
                  <option value="ger">German (ger)</option>
                  <option value="jpn">Japanese (jpn)</option>
                  <option value="ita">Italian (ita)</option>
                  <option value="chi">Chinese (chi)</option>
                  <option value="kor">Korean (kor)</option>
                  <option value="first">First Track</option>
                </select>
              </div>
            </div>

            <button 
              type="button"
              className="btn btn-outline-blue btn-sm"
              style={{ width: '100%', marginTop: '6px' }}
              onClick={handleApplyBatchConfig}
              disabled={isTranscoding || selectedPaths.size === 0}
            >
              Apply to Selected ({selectedPaths.size})
            </button>
          </div>
          )}

          {/* HandBrake Encoder Settings */}
          <div 
            className="section-title"
            onClick={() => setPresetProfileCollapsed(!presetProfileCollapsed)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} />
              HandBrake Preset Profile
            </div>
            {presetProfileCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>

          {!presetProfileCollapsed && (
            <div style={{ background: 'rgba(28, 32, 42, 0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '6px' }}>
              <div className="form-group">
                <label>Selected Custom Preset File</label>
                <div className="relative-dir-box" title={settings.handbrakePresetPath}>
                  {settings.handbrakePresetPath ? settings.handbrakePresetPath : 'None selected (using Manual/Fallback)'}
                </div>
                {settings.handbrakePresetName && (
                  <span className="text-muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Active Preset: <strong style={{ color: 'var(--accent)' }}>{settings.handbrakePresetName}</strong>
                  </span>
                )}
                <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '6px', display: 'block' }}>
                  Import presets JSON files under the <strong>Settings</strong> window.
                </span>
              </div>
            </div>
          )}
          
          {/* Action Trigger Buttons */}
          <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isTranscoding ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px', fontSize: '11px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.3)', color: '#fbbf24' }} 
                    onClick={handlePauseAll}
                  >
                    PAUSE ALL
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }} 
                    onClick={handleResumeAll}
                  >
                    RESUME ALL
                  </button>
                </div>
                <button className="btn btn-danger" style={{ width: '100%', padding: '12px' }} onClick={handleStopTranscode}>
                  <Square size={16} />
                  STOP QUEUE
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', background: 'var(--accent)' }} 
                onClick={handleStartTranscode}
                disabled={scannedFiles.length === 0 || selectedPaths.size === 0}
              >
                <Play size={16} />
                START BATCH TRANSCODE ({selectedPaths.size} files)
              </button>
            )}
            
            {scannedFiles.length > 0 && (
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setScannedFiles([]);
                  setSelectedPaths(new Set());
                  setScanDir('');
                }}
                disabled={isTranscoding}
              >
                <Trash2 size={14} />
                Clear scanned results
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Panel: Queue Drawer */}
      <footer className="bottom-drawer" style={{ position: 'relative' }}>
        <div 
          className={`resizer-bar ${isResizingQueue ? 'dragging' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingQueue(true);
          }}
        />
        <div className="drawer-header">
          <div className="drawer-title">
            <Loader2 size={12} className={isTranscoding ? 'animate-spin' : ''} style={{ color: isTranscoding ? 'var(--accent)' : 'var(--text-muted)' }} />
            Active Transcode Queue {queue.length > 0 && `(${queue.filter(i => i.status === 'Completed').length} / ${queue.length} completed)`}
          </div>
          {queue.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setQueue([])} disabled={isTranscoding} style={{ height: '24px', padding: '0 8px', fontSize: '10.5px' }}>
              Clear Queue
            </button>
          )}
        </div>
        <div className="drawer-content">
          {/* Active Job list */}
          <div className="queue-list-wrapper">
            {queue.length === 0 ? (
              <div className="queue-empty">
                <FileVideo size={24} />
                No files in the transcoding queue. Select files and click "Start Batch Transcode".
              </div>
            ) : (
              <div className="queue-items-grid">
                {queue.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`queue-item-card ${item.status === 'Processing' ? 'processing' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setActiveConsoleFile(item.file);
                      setActiveConsoleLog(consoleLogsRef.current[item.file.fullPath] || 'No logs received for this file yet.');
                    }}
                  >
                    <div className="queue-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="queue-item-name" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '12px' }}>{item.file.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`queue-item-status ${item.status.toLowerCase()}`}>{item.status}</span>
                        <div className="queue-item-actions" style={{ display: 'flex', gap: '4px' }}>
                          {item.status === 'Processing' && (
                            <button 
                              className="btn btn-xs" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '20px', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(217, 119, 6, 0.4)', color: '#fbbf24', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePauseJob(item.file.fullPath);
                              }}
                              title="Pause"
                            >
                              Pause
                            </button>
                          )}
                          {item.status === 'Paused' && (
                            <button 
                              className="btn btn-xs" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '20px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResumeJob(item.file.fullPath);
                              }}
                              title="Resume"
                            >
                              Resume
                            </button>
                          )}
                          {(item.status === 'Processing' || item.status === 'Paused') && (
                            <button 
                              className="btn btn-xs" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '20px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopJob(item.file.fullPath);
                              }}
                              title="Stop/Cancel"
                            >
                              Stop
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="progress-track">
                      <div 
                        className={`progress-bar ${item.status === 'Completed' ? 'success' : item.status === 'Failed' ? 'danger' : ''}`} 
                        style={{ width: `${item.percent}%` }} 
                      />
                    </div>

                    <div className="queue-item-stats">
                      <span>Progress: <strong>{item.percent.toFixed(1)}%</strong></span>
                      {item.status === 'Processing' && (
                        <>
                          <span>Speed: <strong>{item.speed.toFixed(1)} FPS</strong> (Avg: {item.avgSpeed.toFixed(1)})</span>
                          <span>ETA: <strong>{item.eta}</strong></span>
                        </>
                      )}
                      {item.status === 'Failed' && (
                        <span style={{ color: 'var(--plex-red-text)' }}>Error: {item.error || 'Unknown Error'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job terminal console output */}
          <div className="console-log-panel">
            <div className="console-header">
              Console Logs: {activeConsoleFile ? activeConsoleFile.name : 'Select job to view'}
            </div>
            <div className="console-output">
              {activeConsoleLog}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal 
          settings={settings} 
          setSettings={setSettings} 
          toolsState={toolsState}
          onClose={() => setSettingsOpen(false)} 
          onSave={handleSaveSettings}
          showToast={showToast}
        />
      )}

      {/* Plex File Details Modal */}
      {detailsFile && (
        <DetailsModal 
          file={detailsFile} 
          onClose={() => setDetailsFile(null)} 
        />
      )}

      {/* Quality Inspector Sample Modal */}
      {sampleFile && sampleConfig && (
        <SampleModal 
          file={sampleFile}
          config={sampleConfig}
          onSaveConfig={handleSaveSampleConfig}
          onClose={() => {
            setSampleFile(null);
            setSampleConfig(null);
          }}
          showToast={showToast}
        />
      )}

      {/* App Close Confirmation Overlay Modal */}
      {closeConfirmationOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="modal-header" style={{ background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="modal-title" style={{ color: 'var(--plex-red-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                Confirm Exit
              </h2>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-main)' }}>
              Active transcoding is currently in progress. If you close the application now, **all active transcodes will be aborted and lost**.
              <br /><br />
              Are you sure you want to exit the application?
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={async () => {
                  setCloseConfirmationOpen(false);
                  await window.api.confirmAppClose(false);
                }}
              >
                No, Keep Transcoding
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ padding: '8px 16px', background: 'var(--plex-red-text)', color: 'var(--text-bright)' }}
                onClick={async () => {
                  setCloseConfirmationOpen(false);
                  await window.api.confirmAppClose(true);
                }}
              >
                Yes, Abort and Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Drawer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <AlertTriangle className="toast-icon" size={20} />
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
              {toast.title.includes('Missing Required Tools') && (
                <div className="toast-links">
                  <a href="https://handbrake.fr/downloads2.php" target="_blank" rel="noreferrer" className="toast-link">
                    HandBrakeCLI
                    <ExternalLink size={10} />
                  </a>
                  <a href="https://mediaarea.net/en/MediaInfo/Download" target="_blank" rel="noreferrer" className="toast-link">
                    MediaInfo
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
            {!toast.persistent && (
              <button className="modal-close-btn" style={{ position: 'absolute', right: '12px', top: '12px' }} onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Update Modal */}
      {updateModalOpen && updateInfo && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} style={{ color: 'var(--accent)' }} className={isDownloadingUpdate ? "animate-spin" : ""} />
                New Update Available
              </h2>
              {!isDownloadingUpdate && (
                <button className="modal-close-btn" onClick={() => setUpdateModalOpen(false)}>
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="modal-body" style={{ maxHeight: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                A newer version <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{updateInfo.latestVersion}</strong> is available (current: <strong>v{appVersion}</strong>).
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Release Notes</div>
              <div 
                style={{ 
                  background: 'var(--bg-darker)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  fontSize: '12px', 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-main)',
                  marginBottom: '16px'
                }}
              >
                {updateInfo.releaseNotes || 'No release notes provided.'}
              </div>

              {isDownloadingUpdate && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'rgba(0, 132, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 132, 255, 0.2)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-bright)' }}>Downloading & installing the latest update...</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>The application will close automatically once the installation starts.</span>
                </div>
              )}

              {downloadError && (
                <div style={{ color: 'var(--plex-red-text)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <AlertTriangle size={16} />
                  <span>Error: {downloadError}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setUpdateModalOpen(false)}
                disabled={isDownloadingUpdate}
              >
                Remind Me Later
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ background: 'var(--accent)' }}
                onClick={handleDownloadAndInstall}
                disabled={isDownloadingUpdate || !updateInfo.downloadUrl}
              >
                {isDownloadingUpdate ? 'Installing...' : 'Download & Install Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Settings Modal
function SettingsModal({ settings, setSettings, toolsState, onClose, onSave, showToast }) {
  const [presets, setPresets] = useState([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Load presets if path exists
  useEffect(() => {
    if (localSettings.handbrakePresetPath) {
      loadPresets(localSettings.handbrakePresetPath);
    }
  }, [localSettings.handbrakePresetPath]);

  const loadPresets = async (filePath) => {
    setIsLoadingPresets(true);
    try {
      const res = await window.api.selectDirectory(); // Re-used selectDirectory to trigger dialog in Electron main?
      // Wait, we need an file selector dialog. Let's make an input that user can browse.
      // Wait, since we are doing electron, how can the user select a file?
      // Let's implement an IPC handler in electron's main process for file selection!
    } catch (e) {}
    setIsLoadingPresets(false);
  };

  const handleBrowsePresetFile = async () => {
    // In Electron, we can use select-directory or write a file selector!
    // Since we need to browse file, let's write a file browser or use dialog.
    // In main.js we have select-directory. Let's see: we can trigger dialog.showOpenDialog for file JSON.
    // Wait, let's write a file picker in main.js if needed, or check if we can add an IPC handle!
    // Let's trigger a custom dialog from main.js. Let's write an IPC channel that supports files!
    // We already have main.js. Let's make sure it handles file selection or we can just input it.
    // Wait, we can call select-directory or let the user type the path.
    // Wait, to make it super premium: let's add an IPC channel "select-file" to main.js!
    // Wait! Can we do that? Yes, we can modify main.js to add it!
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">HB Minigun Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className="modal-body">
            {/* Tools Diagnostics */}
            <div className="form-group" style={{ background: 'rgba(28, 32, 42, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-bright)', marginBottom: '12px' }}>System Executables Diagnostic</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span>HandBrakeCLI:</span>
                  {toolsState.handbrakeInstalled ? (
                    <span style={{ color: 'var(--plex-green-text)', fontWeight: '600' }} className="flex-row">
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span style={{ color: 'var(--plex-red-text)', fontWeight: '600' }} className="flex-row">
                      <AlertTriangle size={14} /> Missing
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Path: {toolsState.handbrakePath || 'Not found'}
                </div>

                <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', fontSize: '12.5px' }}>
                  <span>MediaInfo:</span>
                  {toolsState.mediaInfoInstalled ? (
                    <span style={{ color: 'var(--plex-green-text)', fontWeight: '600' }} className="flex-row">
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span style={{ color: 'var(--plex-red-text)', fontWeight: '600' }} className="flex-row">
                      <AlertTriangle size={14} /> Missing
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Path: {toolsState.mediaInfoPath || 'Not found'}
                </div>
              </div>
            </div>

            {/* Custom Executable Paths */}
            <div className="form-group">
              <label>Custom HandBrakeCLI Path (Optional)</label>
              <input 
                type="text" 
                className="text-input" 
                placeholder="e.g. C:\Tools\HandBrakeCLI.exe" 
                value={localSettings.handbrakePath}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, handbrakePath: e.target.value }))}
              />
              <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                Leave empty to look in standard paths and system PATH.
              </span>
            </div>

            <div className="form-group">
              <label>Custom MediaInfo Path (Optional)</label>
              <input 
                type="text" 
                className="text-input" 
                placeholder="e.g. C:\Tools\MediaInfo.exe" 
                value={localSettings.mediaInfoPath}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, mediaInfoPath: e.target.value }))}
              />
              <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                Leave empty to look in standard paths and system PATH.
              </span>
            </div>

            {/* Temp Directory */}
            <div className="form-group">
              <label>Replace Temp Directory Location</label>
              <input 
                type="text" 
                className="text-input" 
                value={localSettings.tempDir}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, tempDir: e.target.value }))}
              />
              <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                Temporary directory for Option #1 encoding. Default: <code>C:\TempHBMG</code>
              </span>
            </div>

            {/* Custom HandBrake Preset File */}
            <div className="form-group">
              <label>HandBrake Preset File (.json)</label>
              <div className="input-with-button">
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Enter path to custom preset json..."
                  value={localSettings.handbrakePresetPath}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, handbrakePresetPath: e.target.value }))}
                />
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={async () => {
                    // Let's call select directory but we will instruct user to copy-paste or write a custom file dialog.
                    // To keep it simple, we let them enter the path, or browse if we can.
                    showToast('Instruction', 'Please copy-paste the absolute path to your custom HandBrake presets JSON file.');
                  }}
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>HandBrake Preset Name</label>
              <input 
                type="text" 
                className="text-input" 
                placeholder="e.g. Fast 1080p30"
                value={localSettings.handbrakePresetName}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, handbrakePresetName: e.target.value }))}
              />
              <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                Type the exact, case-sensitive preset name that corresponds to the exported JSON.
              </span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary"
              onClick={(e) => {
                onSave(e, localSettings);
                setSettings(localSettings);
              }}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Details Modal
function DetailsModal({ file, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header" style={{ borderBottomColor: 'var(--plex-red-border)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h2 className="modal-title" style={{ color: 'var(--plex-red-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            Plex Compatibility Report
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Filename</label>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-bright)' }}>{file.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', wordBreak: 'break-all' }}>{file.fullPath}</div>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '16px 0' }} />

          <div className="form-group">
            <label style={{ color: 'var(--plex-red-text)' }}>Compatibility Issues ({file.plexIssues.length})</label>
            <ul style={{ paddingLeft: '20px', fontSize: '12.5px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {file.plexIssues.map((issue, idx) => (
                <li key={idx} style={{ color: '#fca5a5' }}>{issue}</li>
              ))}
            </ul>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '16px 0' }} />

          <div className="form-group">
            <label>Media Tracks Layout</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Video:</span>
                <div style={{ fontSize: '13px', color: 'var(--text-bright)', marginTop: '2px' }}>Codec: {file.videoCodec} ({file.videoFormat || 'Unknown Profile'})</div>
              </div>
              
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Audio Streams:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {file.audioStreams.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>
                      #{idx + 1}: <strong>{s.codec}</strong> ({s.language}) - {s.channels} channels
                    </div>
                  ))}
                  {file.audioStreams.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No audio streams detected</div>}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subtitles:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {file.subtitleStreams.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>
                      #{idx + 1}: <strong>{s.format}</strong> ({s.language})
                    </div>
                  ))}
                  {file.subtitleStreams.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No subtitle streams detected</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ background: 'rgba(20, 23, 29, 0.2)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Quality Inspector Sample Modal
function SampleModal({ file, config, onSaveConfig, onClose, showToast }) {
  const [rf, setRf] = useState(config.quality || 20);
  const [codec, setCodec] = useState(config.videoCodec || 'h264');
  const [timestamp, setTimestamp] = useState(60); // default 60 seconds
  const [isGenerating, setIsGenerating] = useState(false);
  const [sampleUri, setSampleUri] = useState(null);
  const [refUri, setRefUri] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const refVideoRef = useRef(null);
  const sampleVideoRef = useRef(null);

  const duration = file.duration || 1800; // 30 minutes fallback

  // Sync event handlers to prevent loops using a threshold
  const handleRefPlay = () => {
    if (sampleVideoRef.current && sampleVideoRef.current.paused) {
      sampleVideoRef.current.play().catch(() => {});
    }
  };
  const handleRefPause = () => {
    if (sampleVideoRef.current && !sampleVideoRef.current.paused) {
      sampleVideoRef.current.pause();
    }
  };
  const handleRefSeek = () => {
    if (sampleVideoRef.current && refVideoRef.current) {
      const diff = Math.abs(sampleVideoRef.current.currentTime - refVideoRef.current.currentTime);
      if (diff > 0.03) {
        sampleVideoRef.current.currentTime = refVideoRef.current.currentTime;
      }
    }
  };
  const handleRefRateChange = () => {
    if (sampleVideoRef.current && refVideoRef.current && sampleVideoRef.current.playbackRate !== refVideoRef.current.playbackRate) {
      sampleVideoRef.current.playbackRate = refVideoRef.current.playbackRate;
    }
  };

  const handleSamplePlay = () => {
    if (refVideoRef.current && refVideoRef.current.paused) {
      refVideoRef.current.play().catch(() => {});
    }
  };
  const handleSamplePause = () => {
    if (refVideoRef.current && !refVideoRef.current.paused) {
      refVideoRef.current.pause();
    }
  };
  const handleSampleSeek = () => {
    if (refVideoRef.current && sampleVideoRef.current) {
      const diff = Math.abs(refVideoRef.current.currentTime - sampleVideoRef.current.currentTime);
      if (diff > 0.03) {
        refVideoRef.current.currentTime = sampleVideoRef.current.currentTime;
      }
    }
  };
  const handleSampleRateChange = () => {
    if (refVideoRef.current && sampleVideoRef.current && refVideoRef.current.playbackRate !== sampleVideoRef.current.playbackRate) {
      refVideoRef.current.playbackRate = sampleVideoRef.current.playbackRate;
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return [
      h > 0 ? h : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSampleUri(null);
    setRefUri(null);
    try {
      const res = await window.api.generateSamples({
        filePath: file.fullPath,
        timestamp,
        codec,
        rf
      });
      if (res.success) {
        setSampleUri(res.sampleUri);
        setRefUri(res.refUri);
      } else {
        showToast('Generation Failed', res.error);
      }
    } catch (e) {
      showToast('Error', e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={isMaximized ? { 
          maxWidth: 'none', 
          width: '98vw', 
          height: '96vh', 
          maxHeight: 'none', 
          display: 'flex', 
          flexDirection: 'column' 
        } : {
          maxWidth: '1000px', 
          width: '90vw', 
          height: 'auto', 
          maxHeight: '95vh', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--accent)' }} />
            Quality Inspector & Sample Preview
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="modal-close-btn" 
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={onClose} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div 
          className="modal-body" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            flex: isMaximized ? 1 : 'none', 
            minHeight: '0', 
            maxHeight: 'none', // Override index.css max-height: 400px
            overflowY: 'auto' 
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Compare frame details side-by-side to find the optimal RF target. Choose a timestamp on the timeline, set your RF, and click Generate.
          </div>

          {/* Screen Display Row - Flexes and stretches both columns to take all vertical space when maximized */}
          <div 
            style={isMaximized ? { 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '20px', 
              flex: 1, 
              minHeight: '0',
              alignItems: 'stretch'
            } : { 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '20px',
              alignItems: 'stretch'
            }}
          >
            {/* Left Screen: Original Reference */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                minHeight: '0',
                flex: 1
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--plex-green-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Original Video Reference (Source)
              </div>
              <div 
                style={isMaximized ? { 
                  flex: 1,
                  minHeight: '0', 
                  background: '#0c0e12', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                } : { 
                  aspectRatio: '16/9',
                  background: '#0c0e12', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%'
                }}
              >
                {isGenerating && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: 'var(--plex-green-text)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting reference...</span>
                  </div>
                )}
                {!isGenerating && !refUri && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click Generate Preview to load</span>
                )}
                {refUri && !isGenerating && (
                  <video 
                    ref={refVideoRef}
                    src={refUri} 
                    autoPlay 
                    loop 
                    muted 
                    controls 
                    onPlay={handleRefPlay}
                    onPause={handleRefPause}
                    onSeeked={handleRefSeek}
                    onRateChange={handleRefRateChange}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>

            {/* Right Screen: Transcoded Sample */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                minHeight: '0',
                flex: 1
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Transcoded Preview (RF {rf})
              </div>
              <div 
                style={isMaximized ? { 
                  flex: 1,
                  minHeight: '0', 
                  background: '#0c0e12', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                } : { 
                  aspectRatio: '16/9',
                  background: '#0c0e12', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%'
                }}
              >
                {isGenerating && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Encoding preview...</span>
                  </div>
                )}
                {!isGenerating && !sampleUri && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click Generate Preview to load</span>
                )}
                {sampleUri && !isGenerating && (
                  <video 
                    ref={sampleVideoRef}
                    src={sampleUri} 
                    autoPlay 
                    loop 
                    muted 
                    controls 
                    onPlay={handleSamplePlay}
                    onPause={handleSamplePause}
                    onSeeked={handleSampleSeek}
                    onRateChange={handleSampleRateChange}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ background: 'rgba(28, 32, 42, 0.4)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
              {/* Seek Bar */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Video Timeline Position: <strong>{formatTime(timestamp)}</strong> / {formatTime(duration)}
                </label>
                <input 
                  type="range"
                  min="0"
                  max={Math.floor(duration)}
                  value={timestamp}
                  onChange={(e) => setTimestamp(parseInt(e.target.value))}
                  className="custom-slider"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Codec Selection */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Codec</label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={codec}
                  onChange={(e) => setCodec(e.target.value)}
                >
                  <option value="h264">H.264</option>
                  <option value="h265">H.265 (HEVC)</option>
                </select>
              </div>

              {/* Quality RF Selection */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Target Quality (RF): <strong>{rf}</strong>
                </label>
                <select 
                  className="table-select" 
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={rf}
                  onChange={(e) => setRf(parseInt(e.target.value))}
                >
                  {Array.from({ length: 21 }, (_, i) => 30 - i).map(q => (
                    <option key={q} value={q}>RF {q}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Close
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              style={{ background: 'var(--accent)' }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Preview'}
            </button>
            <button 
              type="button" 
              className="btn btn-success"
              style={{ background: '#059669', color: '#fff' }}
              onClick={() => {
                onSaveConfig(file.fullPath, rf, codec);
                showToast('Success', `Applied settings (RF ${rf}, Codec ${codec}) to files table.`, 'success');
                onClose();
              }}
            >
              Apply Quality Settings to File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
