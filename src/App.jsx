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
import logo from './assets/logo.png';

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
    ffmpegPath: '',
    engines: 2,
    tempDir: 'C:\\TempHBMG'
  });
  const [toolsState, setToolsState] = useState({
    handbrakeInstalled: true,
    mediaInfoInstalled: true,
    ffmpegInstalled: false,
    handbrakePath: '',
    mediaInfoPath: '',
    ffmpegPath: ''
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
  const [directoryOptionsCollapsed, setDirectoryOptionsCollapsed] = useState(false);
  const [presetProfileCollapsed, setPresetProfileCollapsed] = useState(false);
  const [batchApplyCollapsed, setBatchApplyCollapsed] = useState(false);
  const [autoScanCollapsed, setAutoScanCollapsed] = useState(false);
  const [settingsPanelCollapsed, setSettingsPanelCollapsed] = useState(false);
  const [mediaLibraryCollapsed, setMediaLibraryCollapsed] = useState(false);
  const [collapsedDirs, setCollapsedDirs] = useState({});
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
  
  // Verify & Sync Modal States
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncItems, setSyncItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Resizing states for bottom queue drawer
  const [queueHeight, setQueueHeight] = useState(220);
  const [isResizingQueue, setIsResizingQueue] = useState(false);
  const [queueCollapsed, setQueueCollapsed] = useState(true);

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
  const [batchResolution, setBatchResolution] = useState('original');
  
  // Track counts sliders states
  const [batchAudioCount, setBatchAudioCount] = useState(2);
  const [batchSubCount, setBatchSubCount] = useState(0);

  // Dynamic language settings array
  const [batchAudioLangs, setBatchAudioLangs] = useState(['eng', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none']);
  const [batchSubLangs, setBatchSubLangs] = useState(['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none']);

  // Legacy single properties for fallback
  const [batchAudioLang, setBatchAudioLang] = useState('eng');
  const [batchAudioLang2, setBatchAudioLang2] = useState('none');
  const [batchSubLang, setBatchSubLang] = useState('none');
  const [batchSubLang2, setBatchSubLang2] = useState('none');

  const handleUpdateAudioSource = (filePath, index, value) => {
    setFileConfigs(prev => {
      const fileConf = prev[filePath] || {};
      const sources = [...(fileConf.audioSources || [])];
      // Pad array if needed
      while (sources.length <= index) {
        sources.push('none');
      }
      sources[index] = value;
      return {
        ...prev,
        [filePath]: {
          ...fileConf,
          audioSources: sources
        }
      };
    });
  };

  const handleUpdateSubtitleSource = (filePath, index, value) => {
    setFileConfigs(prev => {
      const fileConf = prev[filePath] || {};
      const sources = [...(fileConf.subtitleSources || [])];
      // Pad array if needed
      while (sources.length <= index) {
        sources.push('none');
      }
      sources[index] = value;
      return {
        ...prev,
        [filePath]: {
          ...fileConf,
          subtitleSources: sources
        }
      };
    });
  };

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
          // Match all N audio sources based on languages in batchAudioLangs
          const audioSources = [];
          for (let i = 0; i < batchAudioCount; i++) {
            const langCode = batchAudioLangs[i] || 'none';
            let trackVal = 'none';
            if (file.audioStreams.length > 0) {
              if (langCode === 'first') {
                trackVal = '1';
              } else if (langCode !== 'none') {
                const matchedIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, langCode));
                trackVal = matchedIdx !== -1 ? (matchedIdx + 1).toString() : 'none';
              }
            }
            audioSources.push(trackVal);
          }

          // Match all M subtitle sources based on languages in batchSubLangs
          const subtitleSources = [];
          for (let i = 0; i < batchSubCount; i++) {
            const langCode = batchSubLangs[i] || 'none';
            let trackVal = 'none';
            if (file.subtitleStreams.length > 0) {
              if (langCode === 'first') {
                trackVal = '1';
              } else if (langCode !== 'none') {
                const matchedIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, langCode));
                trackVal = matchedIdx !== -1 ? (matchedIdx + 1).toString() : 'none';
              }
            }
            subtitleSources.push(trackVal);
          }

          next[file.fullPath] = {
            ...next[file.fullPath],
            videoCodec: batchVideoCodec,
            quality: batchQuality,
            framerate: batchFramerate,
            audioCodec: batchAudioCodec,
            resolution: batchResolution,
            audioSources: audioSources,
            subtitleSources: subtitleSources,
            // Keep legacy ones for compatibility
            audioSource1: audioSources[0] || 'none',
            audioSource2: audioSources[1] || 'none',
            subtitleSource1: subtitleSources[0] || 'none',
            subtitleSource2: subtitleSources[1] || 'none'
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

  // Refresh current scan dir without clearing — re-reads the same folder
  const handleRefreshScan = async () => {
    if (!scanDir) return;
    await runScan(scanDir);
  };

  // Scan an additional folder and MERGE results into the existing list
  const handleScanNewFolder = async () => {
    try {
      const folderPath = await window.api.selectDirectory();
      if (!folderPath) return;
      setIsScanning(true);
      const checkConfig = {
        transcodeMode,
        destinationDir,
        presetFile: settings.handbrakePresetPath
      };
      const newFiles = await window.api.scanDirectory(folderPath, checkConfig);
      setScannedFiles(prev => {
        const existingPaths = new Set(prev.map(f => f.fullPath));
        return [...prev, ...newFiles.filter(f => !existingPaths.has(f.fullPath))];
      });
      // Init configs for new files
      const newConfigs = {};
      newFiles.forEach(file => {
        let audioSrc1 = 'none';
        if (file.audioStreams.length > 0) {
          const engIdx = file.audioStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
          audioSrc1 = engIdx !== -1 ? (engIdx + 1).toString() : '1';
        }
        let subSrc1 = 'none';
        if (file.subtitleStreams.length > 0) {
          const engIdx = file.subtitleStreams.findIndex(s => s.language && languagesMatch(s.language, 'eng'));
          subSrc1 = engIdx !== -1 ? (engIdx + 1).toString() : 'none';
        }
        newConfigs[file.fullPath] = {
          videoCodec: 'h264', quality: 20, framerate: 'constant',
          audioCodec: 'AAC', audioSource1: audioSrc1,
          audioSource2: 'none', subtitleSource1: subSrc1, subtitleSource2: 'none'
        };
      });
      setFileConfigs(prev => ({ ...prev, ...newConfigs }));
      showToast('Scan Added', `Added ${newFiles.length} files from ${folderPath}.`, 'success');
    } catch (err) {
      showToast('Scan Failed', err.message);
    } finally {
      setIsScanning(false);
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

  const toggleDirCollapsed = (dir) => {
    setCollapsedDirs(prev => ({
      ...prev,
      [dir]: !prev[dir]
    }));
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

    setQueueCollapsed(false);
    setMediaLibraryCollapsed(true);
    setSettingsPanelCollapsed(true);

    const newQueueItems = filesToProcess.map(f => ({
      file: f,
      percent: 0,
      speed: 0,
      avgSpeed: 0,
      eta: 'Waiting...',
      status: 'Queued'
    }));

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

    // If a queue is already running, append to it instead of starting fresh.
    if (isTranscoding) {
      const existingPaths = new Set(queue.map(i => i.file.fullPath));
      const toAdd = newQueueItems.filter(i => !existingPaths.has(i.file.fullPath));
      if (toAdd.length === 0) {
        showToast('Queue', 'Selected files are already in the queue.', 'warning');
        return;
      }
      setQueue(prev => [...prev, ...toAdd]);
      try {
        await window.api.appendTranscodeFiles(toAdd.map(i => i.file), config);
        showToast('Queue Updated', `Added ${toAdd.length} file(s) to the running queue.`, 'success');
      } catch (err) {
        showToast('Queue Error', err.message);
      }
      return;
    }

    // Clear logs
    consoleLogsRef.current = {};
    setActiveConsoleLog('');
    setActiveConsoleFile(filesToProcess[0]);

    setQueue(newQueueItems);
    setIsTranscoding(true);

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

  const handleRemoveFromQueue = async (filePath) => {
    try {
      const res = await window.api.removeFromQueue(filePath);
      if (res.success) {
        setQueue(prev => prev.filter(item => item.file.fullPath !== filePath));
        showToast('Queue Update', 'File removed from queue.', 'success');
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



  // Post transcode Verify & Sync for Option #1 (transcodeDir)
  const [isPerformingMoveCopy, setIsPerformingMoveCopy] = useState(false);
  
  const handleOpenSyncModal = async () => {
    if (transcodeMode !== 'transcodeDir' || !destinationDir) {
      showToast('Operation Failed', 'Post-process Verification & Sync is only available when transcoding to a directory.', 'warning');
      return;
    }

    // 1. Gathers completed items from the active queue
    const completedFromQueue = queue.filter(item => item.status === 'Completed').map(item => ({
      file: item.file,
      status: 'Completed'
    }));

    // 2. Gathers processed items from the scanned files list
    const processedFromScanned = scannedFiles.filter(f => f.isProcessed).map(f => ({
      file: f,
      status: 'Completed'
    }));

    // Merge lists to avoid duplicates (active queue takes priority)
    const mergedMap = new Map();
    processedFromScanned.forEach(item => mergedMap.set(item.file.fullPath, item));
    completedFromQueue.forEach(item => mergedMap.set(item.file.fullPath, item));
    
    const completedItems = Array.from(mergedMap.values());

    if (completedItems.length === 0) {
      showToast('No Completed Files', 'No successfully transcoded files exist in the current queue or directory to verify/sync.', 'warning');
      return;
    }

    setIsPerformingMoveCopy(true);
    try {
      const files = completedItems.map(item => item.file);
      const config = {
        presetFile: settings.handbrakePresetPath,
        destinationDir: destinationDir
      };

      const infoList = await window.api.getTranscodedFilesInfo(files, config);
      
      const mapped = completedItems.map(item => {
        const info = infoList.find(infoItem => infoItem.filePath === item.file.fullPath) || {};
        return {
          file: item.file,
          action: 'move', // default action
          selected: true, // checked by default
          transcodedSize: info.transcodedSize || 0,
          transcodedExists: info.transcodedExists || false,
          originalSize: item.file.sizeBytes || 0,
          status: 'pending', // 'pending' | 'syncing' | 'success' | 'failed'
          error: null,
          transcodedFileLocation: info.transcodedFileLocation || ''
        };
      });

      // Filter out files that don't actually exist on disk in the output directory
      const existingMapped = mapped.filter(item => item.transcodedExists);

      if (existingMapped.length === 0) {
        showToast('No Files on Disk', 'The completed transcoded files could not be found on disk in the output directory.', 'warning');
        return;
      }

      setSyncItems(existingMapped);
      setSyncModalOpen(true);
    } catch (err) {
      showToast('Sync Initialization Failed', err.message);
    } finally {
      setIsPerformingMoveCopy(false);
    }
  };

  const handleExecuteSync = async () => {
    const selectedItems = syncItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      showToast('No Items Selected', 'Please check at least one file to sync.', 'warning');
      return;
    }

    setIsSyncing(true);
    
    // Set status of selected items to syncing
    setSyncItems(prev => prev.map(item => 
      item.selected ? { ...item, status: 'syncing', error: null } : item
    ));

    try {
      // Prepare payload: each selected item has its action override
      const payload = selectedItems.map(item => ({
        file: item.file,
        action: item.action,
        destinationDir: destinationDir
      }));

      const config = {
        presetFile: settings.handbrakePresetPath,
        destinationDir: destinationDir
      };

      const results = await window.api.moveCopyFiles(payload, config);
      
      // Update statuses based on results
      setSyncItems(prev => prev.map(item => {
        const res = results.find(r => r.filePath === item.file.fullPath);
        if (res) {
          return {
            ...item,
            status: res.success ? 'success' : 'failed',
            error: res.error || null
          };
        }
        return item;
      }));

      // Update main queue status for the successfully synced files
      const successfulPaths = new Set(results.filter(r => r.success).map(r => r.filePath));
      if (successfulPaths.size > 0) {
        setQueue(prev => prev.map(qItem => {
          if (successfulPaths.has(qItem.file.fullPath)) {
            return {
              ...qItem,
              status: 'Completed (Synced)'
            };
          }
          return qItem;
        }));
      }

      const failedCount = results.filter(r => !r.success).length;
      if (failedCount === 0) {
        showToast('Sync Complete', `Successfully synced all ${results.length} files.`, 'success');
        // Close modal after brief delay for user to see success checkmarks
        setTimeout(() => {
          setSyncModalOpen(false);
        }, 1500);
      } else {
        showToast('Sync Warning', `Sync completed with ${failedCount} errors. Please review failed items.`, 'warning');
      }

    } catch (err) {
      showToast('Sync Operation Failed', err.message);
      setSyncItems(prev => prev.map(item => 
        item.status === 'syncing' ? { ...item, status: 'failed', error: err.message } : item
      ));
    } finally {
      setIsSyncing(false);
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

  // Helper: Calculate Smart RF value dynamically
  const calculateSmartRF = (file, config) => {
    const codec = config.videoCodec || 'h264';
    const S_orig = (file.sizeBytes || 0) / (1024 * 1024);
    let T = file.duration;
    if (!T || isNaN(T) || T <= 0) {
      T = (file.sizeBytes * 8) / (8000 * 1000);
    }
    const H_orig = file.height || 1080;
    const resolutionHeightMap = { '2160p': 2160, '1080p': 1080, '720p': 720 };
    const H_target = resolutionHeightMap[config.resolution] || H_orig;

    // Source video bitrate (excluding audio portion)
    const B_orig = (S_orig * 8 * 1024) / T;
    const baseBa = 192;
    const videoSrcBitrate = Math.max(500, B_orig - baseBa);

    // Target compression ratio: H.265 = 45%, H.264 = 65%
    const isH265 = codec === 'h265';
    const targetRatio = isH265 ? 0.45 : 0.65;
    const targetBv = videoSrcBitrate * targetRatio;

    // Get B_base for target height
    let B_base;
    if (H_target >= 2160)      B_base = 45000;
    else if (H_target >= 1080) B_base = 8000;
    else                        B_base = 4000;

    const E_codec = isH265 ? 0.6 : 1.0;
    const denom = B_base * E_codec;

    let calculatedRF = 22;
    const ratioVal = targetBv / denom;
    if (ratioVal > 0) {
      calculatedRF = 22 - 6 * (Math.log(ratioVal) / Math.log(2));
    }

    calculatedRF = Math.round(calculatedRF);
    return Math.max(18, Math.min(28, calculatedRF));
  };

  const estimateTranscodedSize = (file, config) => {
    const codec = config.videoCodec || 'h264';
    const rf    = config.quality === 'auto' ? calculateSmartRF(file, config) : (config.quality || 20);

    // --- Extract the 5 source variables ---

    // S_orig: original size in MB
    const S_orig = (file.sizeBytes || 0) / (1024 * 1024);

    // T: duration in seconds (fall back to bitrate-derived estimate)
    let T = file.duration;
    if (!T || isNaN(T) || T <= 0) {
      T = (file.sizeBytes * 8) / (8000 * 1000);
    }

    // H_orig: source video height
    const H_orig = file.height || 1080;

    // H_target: the height we're actually encoding to (respects resolution dropdown)
    const resolutionHeightMap = { '2160p': 2160, '1080p': 1080, '720p': 720 };
    const H_target = resolutionHeightMap[config.resolution] || H_orig;

    // A_tracks: number of non-none audio slots being kept
    const audioSources = config.audioSources || [
      config.audioSource1 || 'none',
      config.audioSource2 || 'none'
    ];
    const A_tracks = Math.max(1, audioSources.filter(s => s && s !== 'none').length);

    // --- Variable 1: Baseline original bitrate (kbps) ---
    // B_orig = (S_orig * 8 * 1024) / T
    const B_orig = (S_orig * 8 * 1024) / T;

    // --- Variable 2: Resolution-based base video bitrate (uses TARGET height) ---
    let B_base;
    if (H_target >= 2160)      B_base = 45000;
    else if (H_target >= 1080) B_base = 8000;
    else                        B_base = 4000;

    // --- Variable 3: Target video bitrate with RF scaling and codec efficiency ---
    const E_codec = codec === 'h265' ? 0.6 : 1.0;
    let B_v = B_base * Math.pow(2, (22 - rf) / 6) * E_codec;

    // Safety cap: B_v must never exceed 120% of the original bitrate
    B_v = Math.min(B_v, B_orig * 1.2);

    // --- Variable 4: Target audio bitrate ---
    let perTrackBa;
    if (config.audioCodec === 'MP3')                              perTrackBa = 128;
    else if (config.audioCodec === 'AC3' || config.audioCodec === 'EAC3') perTrackBa = 384;
    else                                                           perTrackBa = 192; // AAC / default
    const B_a = perTrackBa * A_tracks;

    // --- Variable 5: Final predicted size ---
    // S_pred (MB) = ((B_v + B_a) * T) / (8 * 1024)
    let S_pred = ((B_v + B_a) * T) / (8 * 1024);

    // Guardrail: never predict more than 125% of the original size
    S_pred = Math.min(S_pred, S_orig * 1.25);

    return S_pred * 1024 * 1024; // return bytes
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
    <div 
      className="app-container" 
      style={{ 
        gridTemplateRows: (mediaLibraryCollapsed && !queueCollapsed) 
          ? '56px auto 1fr' 
          : `56px 1fr ${queueCollapsed ? 32 : queueHeight}px` 
      }}
    >
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <img src={logo} alt="HBMiniGun" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
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
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <main className="app-body">
        {/* Left Side: Directory Scanner */}
        <section className="left-panel" style={mediaLibraryCollapsed ? { flex: 'none', height: 'auto' } : { flex: 1 }}>
          <div className="panel-header">
            <div 
              className="panel-title-area"
              onClick={() => setMediaLibraryCollapsed(!mediaLibraryCollapsed)}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {mediaLibraryCollapsed ? <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
              <span className="panel-title">Media Library</span>
              <span className="badge active">{scannedFiles.length} files</span>
              {selectedPaths.size > 0 && (
                <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent-glow)' }}>
                  {selectedPaths.size} selected
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {scanDir && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRefreshScan}
                  disabled={isScanning}
                  title={`Refresh: ${scanDir}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '11px' }}
                >
                  <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
                  Refresh
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleScanNewFolder}
                disabled={isScanning}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '11px' }}
                title="Scan an additional folder and merge results"
              >
                <FolderOpen size={11} />
                Scan Folder
              </button>
            </div>
          </div>

          {!mediaLibraryCollapsed && (
            <>

          {/* Sub-Header Toolbar for Search, Sort, and Filters */}
          {scannedFiles.length > 0 && (
            <div className="panel-sub-header" style={{
              padding: '10px 16px',
              background: 'rgba(20, 23, 29, 0.25)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Row 1: Search + Sort */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
                  <Search size={14} className="search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search scanned files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '32px', height: '32px' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <select
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', borderRadius: '6px', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}
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
                    style={{ height: '32px', width: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'var(--bg-darker)', minWidth: 'unset', cursor: 'pointer' }}
                  >
                    {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Row 2: Filter Pills segments */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Transcode:</span>
                  <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'not-transcoded', label: 'Not Transcoded' },
                      { value: 'transcoded', label: 'Transcoded' },
                    ].map(opt => {
                      const isActive = transcodedFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTranscodedFilter(opt.value)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none',
                            background: isActive ? 'rgba(0, 132, 255, 0.2)' : 'transparent',
                            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                            transition: 'all 0.15s'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Plex Format:</span>
                  <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {[
                      { value: 'all', label: 'All Formats' },
                      { value: 'plex-ok', label: 'Plex OK' },
                      { value: 'plex-not-ok', label: 'Plex Incompatible' },
                    ].map(opt => {
                      const isActive = filterMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFilterMode(opt.value)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none',
                            background: isActive ? 'rgba(46, 196, 182, 0.18)' : 'transparent',
                            color: isActive ? '#2ec4b6' : 'var(--text-muted)',
                            transition: 'all 0.15s'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
              <table className="files-table" style={{ width: '100%' }}>
                <thead>
                  {/* Grouped Header Categories Row */}
                  <tr style={{ background: 'var(--bg-dark)' }}>
                    <th colSpan={4} className="col-divider" style={{ textAlign: 'center', padding: '7px 10px', fontSize: '13px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#00b4d8', textDecoration: 'underline', borderBottom: '2px solid var(--border)' }}>
                      Source Video Info
                    </th>
                    <th colSpan={3} className="col-divider" style={{ textAlign: 'center', padding: '7px 10px', fontSize: '13px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#2ec4b6', textDecoration: 'underline', borderBottom: '2px solid var(--border)' }}>
                      Playback & Check
                    </th>
                    <th colSpan={6} style={{ textAlign: 'center', padding: '7px 10px', fontSize: '13px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#ffb703', textDecoration: 'underline', borderBottom: '2px solid var(--accent)' }}>
                      Transcode Options
                    </th>
                  </tr>
                  {/* Detail Columns Row */}
                  <tr>
                    <th className="checkbox-col" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={getFilteredFiles().length > 0 && getFilteredFiles().every(f => selectedPaths.has(f.fullPath))}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ width: '100%', minWidth: '220px' }}>Name</th>
                    <th style={{ width: '180px', minWidth: '180px' }}>Original Streams</th>
                    <th className="col-divider compact-cell" style={{ width: '85px', textAlign: 'center' }}>Size / Ext</th>
                    
                    {/* Playback & Check Columns */}
                    <th className="compact-cell" style={{ width: '105px', textAlign: 'center' }}>Plex Playback</th>
                    <th className="compact-cell" style={{ width: '85px', textAlign: 'center' }}>Est. Size</th>
                    <th className="col-divider compact-cell" style={{ width: '85px', textAlign: 'center' }}>Quality Check</th>

                    {/* Transcode Options Columns */}
                    <th style={{ width: '105px' }}>Resolution</th>
                    <th style={{ width: '90px' }}>Video Codec</th>
                    <th style={{ width: '80px' }}>Quality (RF)</th>
                    <th style={{ width: '95px' }}>Frame Rate</th>
                    <th style={{ width: '90px' }}>Audio Codec</th>
                    <th className="compact-cell" style={{ width: '250px', minWidth: '250px' }}>Audio Tracks</th>
                    <th className="compact-cell" style={{ width: '250px', minWidth: '250px' }}>Subtitle Tracks</th>
                  </tr>
                </thead>
                {(() => {
                  const grouped = {};
                  getFilteredFiles().forEach((file) => {
                    const rel = file.relativePath || '';
                    const parts = rel.split(/[/\\]/);
                    const dir = parts.length <= 1 ? 'Root Directory' : parts.slice(0, -1).join('/');
                    if (!grouped[dir]) grouped[dir] = [];
                    grouped[dir].push(file);
                  });

                  const sortedDirs = Object.keys(grouped).sort((a, b) => {
                    if (a === 'Root Directory') return -1;
                    if (b === 'Root Directory') return 1;
                    return a.localeCompare(b);
                  });

                  return sortedDirs.map((dir) => {
                    const isCollapsed = collapsedDirs[dir] === true;
                    const groupFiles = grouped[dir];
                    const groupPaths = groupFiles.map(f => f.fullPath);
                    const allSelected = groupPaths.every(p => selectedPaths.has(p));

                    const handleSelectGroup = (checked) => {
                      setSelectedPaths(prev => {
                        const next = new Set(prev);
                        groupPaths.forEach(p => {
                          if (checked) next.add(p);
                          else next.delete(p);
                        });
                        return next;
                      });
                    };

                    const groupTotalSize = groupFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);

                    return (
                      <tbody key={dir} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Directory Header Row */}
                        <tr style={{ background: 'var(--bg-darker)', borderBottom: '1px solid var(--border)' }}>
                          <td colSpan={13} style={{ padding: '8px 16px', background: 'var(--bg-darker)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                              <input 
                                type="checkbox" 
                                className="custom-checkbox"
                                checked={allSelected}
                                onChange={(e) => handleSelectGroup(e.target.checked)}
                              />
                              <button 
                                type="button"
                                className="btn-chevron"
                                onClick={() => toggleDirCollapsed(dir)}
                              >
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '12px', letterSpacing: '0.5px' }}>{dir}</span>
                              <span className="badge active" style={{ fontSize: '10px', height: '18px', padding: '0 6px', display: 'flex', alignItems: 'center' }}>
                                {groupFiles.length} files
                              </span>
                              <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                Total Size: <strong style={{ color: 'var(--text-main)' }}>{formatBytes(groupTotalSize)}</strong>
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* File Rows (only if not collapsed) */}
                        {!isCollapsed && groupFiles.map((file) => {
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
                              <td className="file-name-cell" style={{ minWidth: '220px' }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  window.api.showInFolder(file.fullPath);
                                }}
                              >
                                <div className="file-title" title={file.name + '\nRight-click → Show in Explorer'}>{file.name}</div>
                                <div className="file-path" title={file.fullPath}>{file.relativePath}</div>
                              </td>
                              
                              {/* Expanded Original Streams details cell */}
                              <td style={{ width: '180px', minWidth: '180px' }}>
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
                                    {file.subtitleStreams.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>No subtitles</span>}
                                  </div>
                                </div>
                              </td>

                              <td className="col-divider compact-cell" style={{ width: '85px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                  <strong style={{ color: 'var(--text-bright)', fontSize: '11px' }}>{formatBytes(file.sizeBytes)}</strong>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>{file.extension}</span>
                                </div>
                              </td>

                              {/* Playback & Check Columns */}
                              <td className="compact-cell" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                                </div>
                              </td>

                              {/* Estimated Size */}
                              <td className="compact-cell" style={{ textAlign: 'center' }}>
                                {(() => {
                                  const estSize = estimateTranscodedSize(file, config);
                                  const percent = Math.round((estSize / file.sizeBytes) * 100);
                                  const diffPercent = percent - 100;
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                      <strong style={{ color: 'var(--accent)', fontSize: '11px' }}>{formatBytes(estSize)}</strong>
                                      <span style={{ color: diffPercent < 0 ? '#4caf50' : '#f44336', fontSize: '10.5px', fontWeight: 'bold' }}>
                                        {diffPercent < 0 ? `${diffPercent}%` : `+${diffPercent}%`}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Sample Preview button with Divider */}
                              <td className="col-divider compact-cell" style={{ textAlign: 'center' }}>
                                <button 
                                  type="button"
                                  className="btn btn-outline-blue btn-xs" 
                                  style={{ padding: '4px 8px', fontSize: '10.5px', height: '24px', background: 'rgba(0, 132, 255, 0.1)', border: '1px solid rgba(0, 132, 255, 0.3)', color: 'var(--accent)' }}
                                  onClick={() => openSampleModal(file, config)}
                                >
                                  Sample
                                </button>
                              </td>

                              {/* Resolution */}
                              <td>
                                <select
                                  className="table-select"
                                  value={config.resolution || 'original'}
                                  onChange={(e) => handleUpdateConfig(file.fullPath, 'resolution', e.target.value)}
                                >
                                  <option value="original">Original</option>
                                  <option value="2160p">2160p</option>
                                  <option value="1080p">1080p</option>
                                  <option value="720p">720p</option>
                                </select>
                              </td>

                              {/* Video Codec Selector */}
                              <td>
                                <select 
                                  className="table-select"
                                  value={config.videoCodec}
                                  onChange={(e) => handleUpdateConfig(file.fullPath, 'videoCodec', e.target.value)}
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
                                  onChange={(e) => handleUpdateConfig(file.fullPath, 'quality', e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
                                  style={{ minWidth: '75px' }}
                                >
                                  <option value="auto">Auto (RF {calculateSmartRF(file, config)})</option>
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
                                >
                                  <option value="AAC">AAC</option>
                                  <option value="AC3">AC3</option>
                                  <option value="EAC3">EAC3</option>
                                  <option value="MP3">MP3</option>
                                  <option value="Copy">Copy</option>
                                </select>
                              </td>

                              {/* Audio Tracks */}
                              <td className="compact-cell" style={{ width: '250px', minWidth: '250px' }}>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', padding: '4px 0' }}>
                                  {Array.from({ length: batchAudioCount }).map((_, aIdx) => {
                                    const currentVal = (config.audioSources && config.audioSources[aIdx]) || 
                                                       (aIdx === 0 ? config.audioSource1 : (aIdx === 1 ? config.audioSource2 : 'none')) || 'none';
                                    return (
                                      <select
                                        key={aIdx}
                                        className="table-select"
                                        style={{ fontSize: '11.5px', padding: '2px 4px', height: '24px', minWidth: '85px', maxWidth: '110px', borderRadius: '3px' }}
                                        value={currentVal}
                                        onChange={(e) => handleUpdateAudioSource(file.fullPath, aIdx, e.target.value)}
                                        title={`Audio Track Slot ${aIdx + 1}`}
                                      >
                                        <option value="none">S{aIdx + 1}: None</option>
                                        {file.audioStreams.map((s, idx) => (
                                          <option key={idx} value={(idx + 1).toString()}>
                                            S{idx + 1}: T{idx + 1} ({s.language || 'unk'})
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Subtitle Tracks */}
                              <td className="compact-cell" style={{ width: '250px', minWidth: '250px' }}>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', padding: '4px 0' }}>
                                  {Array.from({ length: batchSubCount }).map((_, sIdx) => {
                                    const currentVal = (config.subtitleSources && config.subtitleSources[sIdx]) || 
                                                       (sIdx === 0 ? config.subtitleSource1 : (sIdx === 1 ? config.subtitleSource2 : 'none')) || 'none';
                                    return (
                                      <select
                                        key={sIdx}
                                        className="table-select"
                                        style={{ fontSize: '11.5px', padding: '2px 4px', height: '24px', minWidth: '85px', maxWidth: '110px', borderRadius: '3px' }}
                                        value={currentVal}
                                        onChange={(e) => handleUpdateSubtitleSource(file.fullPath, sIdx, e.target.value)}
                                        title={`Subtitle Track Slot ${sIdx + 1}`}
                                      >
                                        <option value="none">S{sIdx + 1}: None</option>
                                        {file.subtitleStreams.map((s, idx) => (
                                          <option key={idx} value={(idx + 1).toString()}>
                                            S{idx + 1}: T{idx + 1} ({s.language || 'unk'})
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  });
                })()}
              </table>
            </div>
          )}
            </>
          )}
        </section>
        <section className={`horizontal-settings-panel ${settingsPanelCollapsed ? 'collapsed' : ''}`}>
          <div 
            className="horizontal-settings-header" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '6px 16px', 
              background: 'rgba(20, 23, 29, 0.8)', 
              borderBottom: '1px solid var(--border)', 
              cursor: 'pointer', 
              userSelect: 'none',
              height: '28px'
            }}
            onClick={() => setSettingsPanelCollapsed(!settingsPanelCollapsed)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-bright)', fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sliders size={12} style={{ color: 'var(--accent)' }} />
              <span>Transcode Options & Settings Panel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              {settingsPanelCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {!settingsPanelCollapsed && (
            <div className="horizontal-settings-grid">
              {/* Column 1: Strategy & Directory */}
              <div className="settings-col">
                <div className="section-title">
                  <FolderOpen size={13} style={{ color: 'var(--accent)' }} />
                  <span>Directory & Strategy</span>
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '10.5px', marginBottom: '3px' }}>Transcode Strategy</label>
                  <select 
                    className="table-select"
                    style={{ width: '100%', padding: '3px 6px', height: '26px' }}
                    value={transcodeMode}
                    onChange={(e) => setTranscodeMode(e.target.value)}
                    disabled={isTranscoding}
                  >
                    <option value="transcodeDir">Option #1: Transcode to Destination Folder</option>
                    <option value="replace">Option #2: Replace Source Files (Temp Directory)</option>
                  </select>
                </div>

                {transcodeMode === 'transcodeDir' ? (
                  <>
                    <div className="form-group">
                      <label style={{ fontSize: '10.5px', marginBottom: '3px' }}>Destination Folder</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder="Select Destination Folder..." 
                          value={destinationDir} 
                          readOnly 
                          style={{ flex: 1, padding: '3px 8px', fontSize: '11px', height: '26px' }}
                        />
                        <button 
                          className="btn btn-secondary btn-xs" 
                          style={{ padding: '0 8px', height: '26px' }}
                          onClick={handleBrowseDestination}
                          disabled={isTranscoding}
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        id="postActionMove" 
                        className="custom-checkbox"
                        checked={postAction === 'move'}
                        onChange={(e) => setPostAction(e.target.checked ? 'move' : 'none')}
                        disabled={isTranscoding}
                      />
                      <label htmlFor="postActionMove" style={{ fontSize: '11px', color: 'var(--text-bright)', cursor: 'pointer', margin: 0 }}>
                        Replace Original file
                      </label>
                    </div>

                    <button 
                      type="button"
                      className="btn btn-primary btn-xs"
                      style={{ width: '100%', height: '24px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--accent)', marginTop: '8px' }}
                      onClick={handleOpenSyncModal}
                      disabled={isTranscoding || isPerformingMoveCopy || (queue.filter(item => item.status === 'Completed').length === 0 && scannedFiles.filter(f => f.isProcessed).length === 0)}
                    >
                      {isPerformingMoveCopy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Manual Sync Transcoded to Source
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'contents' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '10.5px', marginBottom: '3px' }}>Temp Transcode Directory</label>
                      <input 
                        type="text" 
                        className="text-input" 
                        value={settings.tempDir || 'C:\\TempHBMG'} 
                        disabled 
                        style={{ opacity: 0.8, padding: '3px 8px', fontSize: '11px', height: '26px' }}
                      />
                    </div>
                    
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        id="replaceActionMove" 
                        className="custom-checkbox"
                        checked={replaceAction === 'move'}
                        onChange={(e) => setReplaceAction(e.target.checked ? 'move' : 'copy')}
                        disabled={isTranscoding}
                      />
                      <label htmlFor="replaceActionMove" style={{ fontSize: '11px', color: 'var(--text-bright)', cursor: 'pointer', margin: 0 }}>
                        Replace Original file
                      </label>
                    </div>
                  </div>
                )}

              </div>

              {/* Column 2: Batch Apply Settings & Preset */}
              <div className="settings-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                <div className="section-title">
                  <Sliders size={13} style={{ color: '#ffb703' }} />
                  <span>Batch Apply & Preset Settings</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Resolution</label>
                    <select
                      className="table-select"
                      style={{ width: '100%', padding: '2px 4px', height: '24px', fontSize: '11px' }}
                      value={batchResolution}
                      onChange={(e) => setBatchResolution(e.target.value)}
                    >
                      <option value="original">Maintain Original</option>
                      <option value="2160p">2160p (4K — 3840×2160)</option>
                      <option value="1080p">1080p (1920×1080)</option>
                      <option value="720p">720p (1280×720)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Video Codec</label>
                    <select 
                      className="table-select" 
                      style={{ width: '100%', padding: '2px 4px', height: '24px', fontSize: '11px' }}
                      value={batchVideoCodec}
                      onChange={(e) => setBatchVideoCodec(e.target.value)}
                    >
                      <option value="h264">H.264</option>
                      <option value="h265">H.265</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Quality (RF)</label>
                    <select 
                      className="table-select" 
                      style={{ width: '100%', padding: '2px 4px', height: '24px', fontSize: '11px' }}
                      value={batchQuality}
                      onChange={(e) => setBatchQuality(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
                    >
                      <option value="auto">Auto (Smart RF)</option>
                      {Array.from({ length: 21 }, (_, i) => 30 - i).map(q => (
                        <option key={q} value={q}>RF {q}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Frame Rate</label>
                    <select 
                      className="table-select" 
                      style={{ width: '100%', padding: '2px 4px', height: '24px', fontSize: '11px' }}
                      value={batchFramerate}
                      onChange={(e) => setBatchFramerate(e.target.value)}
                    >
                      <option value="constant">Constant</option>
                      <option value="variable">Variable</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Audio Codec</label>
                    <select 
                      className="table-select" 
                      style={{ width: '100%', padding: '2px 4px', height: '24px', fontSize: '11px' }}
                      value={batchAudioCodec}
                      onChange={(e) => setBatchAudioCodec(e.target.value)}
                    >
                      <option value="AAC">AAC</option>
                      <option value="AC3">AC3</option>
                      <option value="EAC3">EAC3</option>
                      <option value="MP3">MP3</option>
                      <option value="Copy">Copy</option>
                    </select>
                  </div>
                </div>

                {/* Audio Sources */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                    <span>Audio Sources</span>
                    <span style={{ color: 'var(--accent)' }}>{batchAudioCount}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={batchAudioCount}
                    onChange={(e) => setBatchAudioCount(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '14px', marginBottom: '4px' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Array.from({ length: batchAudioCount }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', minWidth: '18px' }}>A{i + 1}</span>
                        <select
                          className="table-select"
                          style={{ fontSize: '10.5px', padding: '1px 3px', height: '22px', minWidth: '80px' }}
                          value={batchAudioLangs[i] || 'none'}
                          onChange={(e) => {
                            const next = [...batchAudioLangs];
                            next[i] = e.target.value;
                            setBatchAudioLangs(next);
                          }}
                        >
                          <option value="none">None</option>
                          <option value="first">First Track</option>
                          <option value="eng">English</option>
                          <option value="spa">Spanish</option>
                          <option value="fre">French</option>
                          <option value="ger">German</option>
                          <option value="jpn">Japanese</option>
                          <option value="ita">Italian</option>
                          <option value="chi">Chinese</option>
                          <option value="kor">Korean</option>
                          <option value="rus">Russian</option>
                          <option value="por">Portuguese</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtitle Sources */}
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                    <span>Subtitle Sources</span>
                    <span style={{ color: '#2ec4b6' }}>{batchSubCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={batchSubCount}
                    onChange={(e) => setBatchSubCount(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#2ec4b6', cursor: 'pointer', height: '14px', marginBottom: '4px' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Array.from({ length: batchSubCount }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', minWidth: '18px' }}>S{i + 1}</span>
                        <select
                          className="table-select"
                          style={{ fontSize: '10.5px', padding: '1px 3px', height: '22px', minWidth: '80px' }}
                          value={batchSubLangs[i] || 'none'}
                          onChange={(e) => {
                            const next = [...batchSubLangs];
                            next[i] = e.target.value;
                            setBatchSubLangs(next);
                          }}
                        >
                          <option value="none">None</option>
                          <option value="first">First Track</option>
                          <option value="eng">English</option>
                          <option value="spa">Spanish</option>
                          <option value="fre">French</option>
                          <option value="ger">German</option>
                          <option value="jpn">Japanese</option>
                          <option value="ita">Italian</option>
                          <option value="chi">Chinese</option>
                          <option value="kor">Korean</option>
                          <option value="rus">Russian</option>
                          <option value="por">Portuguese</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', marginBottom: '2px', display: 'block' }}>Active Preset Profile</label>
                  <div className="relative-dir-box" title={settings.handbrakePresetPath} style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {settings.handbrakePresetName ? settings.handbrakePresetName : 'Manual / Fallback'}
                  </div>
                </div>

                <button 
                  type="button"
                  className="btn btn-outline-blue btn-xs"
                  style={{ width: '100%', height: '24px', fontSize: '11px', marginTop: '2px' }}
                  onClick={handleApplyBatchConfig}
                  disabled={selectedPaths.size === 0}
                >
                  Apply Batch ({selectedPaths.size})
                </button>
              </div>

              {/* Column 3: Transcode Engines & Actions */}
              <div className="settings-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                <div className="section-title">
                  <Play size={13} style={{ color: '#4caf50' }} />
                  <span>Transcode Engines & Actions</span>
                </div>

                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold', marginBottom: '2px' }}>
                    <span>Concurrent Engines</span>
                    <span style={{ color: 'var(--accent)' }}>{enginesCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    className="custom-slider"
                    style={{ width: '100%', margin: 0, height: '14px' }}
                    value={enginesCount}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      setEnginesCount(n);
                      if (isTranscoding) {
                        window.api.setMaxEngines(n).catch(() => {});
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10.5px', marginBottom: '3px', display: 'block' }}>Periodic Rescan (Minutes)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      min="0" 
                      className="text-input" 
                      placeholder="0 to disable"
                      value={autoRescanInterval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAutoRescanInterval(isNaN(val) ? 0 : val);
                      }}
                      disabled={isTranscoding && autoRescanInterval > 0}
                      style={{ width: '70px', padding: '3px 8px', fontSize: '11px', height: '26px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        id="autoAddToQueue" 
                        className="custom-checkbox"
                        checked={autoAddToQueue}
                        onChange={(e) => setAutoAddToQueue(e.target.checked)}
                      />
                      <label htmlFor="autoAddToQueue" style={{ fontSize: '10.5px', color: 'var(--text-bright)', cursor: 'pointer', margin: 0 }}>
                        Auto-queue
                      </label>
                    </div>
                  </div>
                  {autoRescanInterval > 0 && scanDir && (
                    <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '4px' }}>
                      Next scan in: <strong>{timeUntilNextScan}s</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                  {isTranscoding ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary btn-xs" 
                          style={{ height: '26px', fontSize: '10px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.3)', color: '#fbbf24' }} 
                          onClick={handlePauseAll}
                        >
                          PAUSE ALL
                        </button>
                        <button 
                          className="btn btn-secondary btn-xs" 
                          style={{ height: '26px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }} 
                          onClick={handleResumeAll}
                        >
                          RESUME ALL
                        </button>
                      </div>
                      <button 
                        className="btn btn-danger btn-xs" 
                        style={{ width: '100%', height: '26px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={handleStopTranscode}
                      >
                        <Square size={10} />
                        STOP QUEUE
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', height: '28px', fontSize: '11.5px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={handleStartTranscode}
                      disabled={scannedFiles.length === 0 || selectedPaths.size === 0}
                    >
                      <Play size={12} />
                      START BATCH ({selectedPaths.size})
                    </button>
                  )}
                  
                  {scannedFiles.length > 0 && (
                    <button 
                      className="btn btn-secondary btn-xs" 
                      style={{ width: '100%', height: '24px', fontSize: '10.5px' }}
                      onClick={() => {
                        setScannedFiles([]);
                        setSelectedPaths(new Set());
                        setScanDir('');
                      }}
                      disabled={isTranscoding}
                    >
                      <Trash2 size={10} />
                      Clear Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Panel: Queue Drawer */}
      <footer className="bottom-drawer" style={{ position: 'relative' }}>
        {!queueCollapsed && (
          <div 
            className={`resizer-bar ${isResizingQueue ? 'dragging' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingQueue(true);
            }}
          />
        )}
        <div 
          className="drawer-header"
          onClick={() => setQueueCollapsed(!queueCollapsed)}
          style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '32px', padding: '0 16px' }}
        >
          <div className="drawer-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={12} className={isTranscoding ? 'animate-spin' : ''} style={{ color: isTranscoding ? 'var(--accent)' : 'var(--text-muted)' }} />
            <span>Active Transcode Queue {queue.length > 0 && `(${queue.filter(i => i.status === 'Completed').length} / ${queue.length} completed)`}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {queue.length > 0 && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setQueue([]);
                }} 
                disabled={isTranscoding} 
                style={{ height: '20px', padding: '0 8px', fontSize: '10px', display: 'flex', alignItems: 'center' }}
              >
                Clear Queue
              </button>
            )}
            {queueCollapsed ? <ChevronRight size={14} style={{ transform: 'rotate(-90deg)', color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>
        {!queueCollapsed && (
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
                            <button 
                              className="btn btn-xs" 
                              style={{ padding: '2px 6px', fontSize: '10px', height: '20px', background: 'rgba(150, 150, 150, 0.1)', border: '1px solid rgba(150, 150, 150, 0.2)', color: 'var(--text-muted)', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromQueue(item.file.fullPath);
                              }}
                              title="Remove from queue"
                            >
                              Remove
                            </button>
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
        )}
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

      {/* Verification & Sync Modal */}
      {syncModalOpen && (
        <SyncModal
          isOpen={syncModalOpen}
          syncItems={syncItems}
          setSyncItems={setSyncItems}
          onClose={() => setSyncModalOpen(false)}
          onExecute={handleExecuteSync}
          isSyncing={isSyncing}
          formatBytes={formatBytes}
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

                <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span>FFmpeg:</span>
                  {toolsState.ffmpegInstalled ? (
                    <span style={{ color: 'var(--plex-green-text)', fontWeight: '600' }} className="flex-row">
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span style={{ color: '#fbbf24', fontWeight: '600' }} className="flex-row">
                      <AlertTriangle size={14} /> Not Found (subtitle conversion disabled)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Path: {toolsState.ffmpegPath || 'Not found'}
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

            <div className="form-group">
              <label>Custom FFmpeg Path (Optional)</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. C:\ffmpeg\bin\ffmpeg.exe"
                value={localSettings.ffmpegPath || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, ffmpegPath: e.target.value }))}
              />
              <span className="text-muted" style={{ fontSize: '10.5px', marginTop: '4px', display: 'block' }}>
                Used for ASS/SSA → SRT subtitle conversion. Leave empty to search standard paths and system PATH.
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
  const [resolution, setResolution] = useState(config.resolution || 'original');
  const [previewDuration, setPreviewDuration] = useState(5);
  const [timestamp, setTimestamp] = useState(60); // default 60 seconds
  const [isGenerating, setIsGenerating] = useState(false);
  const [sampleUri, setSampleUri] = useState(null);
  const [refUri, setRefUri] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewMode, setViewMode] = useState('sidebyside'); // 'sidebyside' | 'slider'
  const [sliderPos, setSliderPos] = useState(50); // 0-100 percent
  const sliderContainerRef = useRef(null);
  const isDraggingSlider = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackPos, setPlaybackPos] = useState(0);   // 0-100 percent of sample duration
  const [sampleDuration, setSampleDuration] = useState(0);
  const playbackRafRef = useRef(null);

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

  // Comparison slider drag handlers
  const handleSliderMouseDown = (e) => {
    e.preventDefault();
    isDraggingSlider.current = true;
  };
  const handleSliderMouseMove = (e) => {
    if (!isDraggingSlider.current || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };
  const handleSliderMouseUp = () => { isDraggingSlider.current = false; };
  const handleSliderTouchMove = (e) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  // Playback controls for slider mode
  const togglePlayPause = () => {
    const ref = refVideoRef.current;
    const smp = sampleVideoRef.current;
    if (!ref && !smp) return;
    if (isPlaying) {
      ref && ref.pause();
      smp && smp.pause();
      setIsPlaying(false);
    } else {
      ref && ref.play().catch(() => {});
      smp && smp.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handlePlaybackScrub = (e) => {
    const pct = parseFloat(e.target.value);
    setPlaybackPos(pct);
    const t = (pct / 100) * sampleDuration;
    if (refVideoRef.current) refVideoRef.current.currentTime = t;
    if (sampleVideoRef.current) sampleVideoRef.current.currentTime = t;
  };

  // RAF loop to keep the scrubber in sync while playing
  const startRaf = () => {
    const tick = () => {
      const v = sampleVideoRef.current || refVideoRef.current;
      if (v && sampleDuration > 0) {
        setPlaybackPos((v.currentTime / sampleDuration) * 100);
      }
      playbackRafRef.current = requestAnimationFrame(tick);
    };
    playbackRafRef.current = requestAnimationFrame(tick);
  };
  const stopRaf = () => {
    if (playbackRafRef.current) cancelAnimationFrame(playbackRafRef.current);
  };

  // Start/stop RAF when playing state changes or samples load
  React.useEffect(() => {
    if (viewMode === 'slider' && isPlaying && (refUri || sampleUri)) {
      startRaf();
    } else {
      stopRaf();
    }
    return stopRaf;
  }, [viewMode, isPlaying, refUri, sampleUri]);

  const handleSliderVideoLoadedMetadata = (e) => {
    if (e.target.duration && !isNaN(e.target.duration)) {
      setSampleDuration(e.target.duration);
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
        rf,
        resolution,
        previewDuration
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
            {/* View mode toggle — only shown when samples are loaded */}
            {refUri && sampleUri && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('sidebyside')}
                  title="Side by Side"
                  style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: viewMode === 'sidebyside' ? 'var(--accent)' : 'transparent', color: viewMode === 'sidebyside' ? '#fff' : 'var(--text-muted)', transition: 'background 0.15s' }}
                >
                  Side by Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  title="Comparison Slider"
                  style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', background: viewMode === 'slider' ? 'var(--accent)' : 'transparent', color: viewMode === 'slider' ? '#fff' : 'var(--text-muted)', transition: 'background 0.15s' }}
                >
                  Comparison Slider
                </button>
              </div>
            )}
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

          {/* Screen Display Row */}
          {viewMode === 'sidebyside' ? (
            <div style={isMaximized ? { display: 'flex', flexDirection: 'row', gap: '20px', flex: 1, minHeight: '0', alignItems: 'stretch' } : { display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch' }}>
              {/* Left: Original */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '0', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--plex-green-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original (Source)</div>
                <div style={isMaximized ? { flex: 1, minHeight: '0', background: '#0c0e12', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' } : { aspectRatio: '16/9', background: '#0c0e12', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
                  {isGenerating && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--plex-green-text)' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting reference...</span></div>)}
                  {!isGenerating && !refUri && (<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click Generate Preview to load</span>)}
                  {refUri && !isGenerating && (<video ref={refVideoRef} src={refUri} autoPlay loop muted controls onPlay={handleRefPlay} onPause={handleRefPause} onSeeked={handleRefSeek} onRateChange={handleRefRateChange} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />)}
                </div>
              </div>
              {/* Right: Transcoded */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '0', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transcoded (RF {rf})</div>
                <div style={isMaximized ? { flex: 1, minHeight: '0', background: '#0c0e12', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' } : { aspectRatio: '16/9', background: '#0c0e12', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' }}>
                  {isGenerating && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Encoding preview...</span></div>)}
                  {!isGenerating && !sampleUri && (<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click Generate Preview to load</span>)}
                  {sampleUri && !isGenerating && (<video ref={sampleVideoRef} src={sampleUri} autoPlay loop muted controls onPlay={handleSamplePlay} onPause={handleSamplePause} onSeeked={handleSampleSeek} onRateChange={handleSampleRateChange} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />)}
                </div>
              </div>
            </div>
          ) : (
            /* Comparison Slider Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: isMaximized ? 1 : 'none', minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span style={{ color: 'var(--plex-green-text)' }}>◄ Original (Source)</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{Math.round(sliderPos)}% / {Math.round(100 - sliderPos)}%</span>
                <span style={{ color: 'var(--accent)' }}>Transcoded (RF {rf}) ►</span>
              </div>
              <div
                ref={sliderContainerRef}
                onMouseMove={handleSliderMouseMove}
                onMouseUp={handleSliderMouseUp}
                onMouseLeave={handleSliderMouseUp}
                onTouchMove={handleSliderTouchMove}
                onTouchEnd={handleSliderMouseUp}
                style={isMaximized
                  ? { flex: 1, minHeight: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0c0e12', border: '1px solid var(--border)', cursor: 'ew-resize' }
                  : { aspectRatio: '16/9', width: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0c0e12', border: '1px solid var(--border)', cursor: 'ew-resize' }
                }
              >
                {(!refUri || !sampleUri) && !isGenerating && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generate a preview first</span>
                  </div>
                )}
                {isGenerating && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generating samples...</span>
                  </div>
                )}
                {/* Transcoded underneath (full width) */}
                {sampleUri && !isGenerating && (
                  <video ref={sampleVideoRef} src={sampleUri} autoPlay muted
                    onLoadedMetadata={handleSliderVideoLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {/* Original on top, clipped to left side of slider */}
                {refUri && !isGenerating && (
                  <video ref={refVideoRef} src={refUri} autoPlay muted
                    onLoadedMetadata={handleSliderVideoLoadedMetadata}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  />
                )}
                {/* Slider handle */}
                {refUri && sampleUri && !isGenerating && (
                  <div
                    onMouseDown={handleSliderMouseDown}
                    onTouchStart={handleSliderMouseDown}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, transform: 'translateX(-50%)', width: '3px', background: '#fff', cursor: 'ew-resize', zIndex: 10 }}
                  >
                    {/* Drag knob */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', cursor: 'ew-resize' }}>
                      <span style={{ fontSize: '14px', color: '#333', userSelect: 'none', letterSpacing: '-2px' }}>&#8942;&#8942;</span>
                    </div>
                    {/* Left label */}
                    <div style={{ position: 'absolute', top: '12px', right: 'calc(100% + 8px)', fontSize: '10px', fontWeight: '700', color: 'var(--plex-green-text)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>ORIG</div>
                    {/* Right label */}
                    <div style={{ position: 'absolute', top: '12px', left: 'calc(100% + 8px)', fontSize: '10px', fontWeight: '700', color: 'var(--accent)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>RF {rf}</div>
                  </div>
                )}
              </div>

              {/* Custom playback controls for slider mode */}
              {refUri && sampleUri && !isGenerating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px 0' }}>
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                  >
                    {isPlaying
                      ? <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="4" height="10" fill="currentColor"/><rect x="7" y="1" width="4" height="10" fill="currentColor"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="1,0 11,6 1,12" fill="currentColor"/></svg>
                    }
                  </button>
                  <input
                    type="range"
                    min="0" max="100" step="0.1"
                    value={playbackPos}
                    onChange={handlePlaybackScrub}
                    className="custom-slider"
                    style={{ flex: 1 }}
                  />
                  <span style={{ flexShrink: 0, fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(Math.round((playbackPos / 100) * sampleDuration))} / {formatTime(Math.round(sampleDuration))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Controls Bar */}
          <div style={{ background: 'rgba(28, 32, 42, 0.4)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
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

              {/* Preview Duration */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Preview Duration: <strong>{previewDuration}s</strong></label>
                <select
                  className="table-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={previewDuration}
                  onChange={(e) => setPreviewDuration(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 5, 8, 10, 15, 20, 30].map(s => (
                    <option key={s} value={s}>{s}s</option>
                  ))}
                </select>
              </div>

              {/* Resolution Selection */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Resolution</label>
                <select
                  className="table-select"
                  style={{ width: '100%', maxWidth: '100%' }}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  <option value="original">Original</option>
                  <option value="2160p">2160p (4K)</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
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

function SyncModal({ isOpen, syncItems, setSyncItems, onClose, onExecute, isSyncing, formatBytes }) {
  if (!isOpen) return null;

  const allSelected = syncItems.length > 0 && syncItems.every(i => i.selected);
  const someSelected = syncItems.some(i => i.selected) && !allSelected;

  const handleSelectAll = (checked) => {
    setSyncItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const handleToggleSelect = (filePath) => {
    setSyncItems(prev => prev.map(item => 
      item.file.fullPath === filePath ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSetAction = (filePath, action) => {
    setSyncItems(prev => prev.map(item => 
      item.file.fullPath === filePath ? { ...item, action } : item
    ));
  };

  const handleSetAllActions = (action) => {
    setSyncItems(prev => prev.map(item => ({ ...item, action })));
  };

  // Calculations
  const selectedItems = syncItems.filter(item => item.selected);
  const totalOriginalSize = selectedItems.reduce((acc, item) => acc + item.originalSize, 0);
  const totalTranscodedSize = selectedItems.reduce((acc, item) => acc + item.transcodedSize, 0);
  const spaceSavings = totalOriginalSize - totalTranscodedSize;
  const savingsPercent = totalOriginalSize > 0 ? Math.round((spaceSavings / totalOriginalSize) * 100) : 0;
  
  const moveCount = selectedItems.filter(item => item.action === 'move').length;
  const copyCount = selectedItems.filter(item => item.action === 'copy').length;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '1150px', width: '95vw', height: '85vh', maxHeight: '90vh', border: '1px solid var(--border)' }}>
        
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-bright)' }}>
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} style={{ color: 'var(--accent)' }} />
              Sync & Replace Library Files
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              Verify transcoded output files on disk and select replacement operations before applying to original library files.
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={isSyncing}>
            <X size={16} />
          </button>
        </div>

        <div style={{ background: 'rgba(20, 23, 29, 0.2)', padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left Bulk Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', userSelect: 'none', color: 'var(--text-bright)' }}>
              <input 
                type="checkbox" 
                className="custom-checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={isSyncing}
              />
              Select All
            </label>
            
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
            
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Bulk Actions:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-outline-blue btn-xs"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => handleSetAllActions('move')}
                disabled={isSyncing}
              >
                Set All to Move
              </button>
              <button 
                type="button" 
                className="btn btn-outline-blue btn-xs"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => handleSetAllActions('copy')}
                disabled={isSyncing}
              >
                Set All to Copy
              </button>
            </div>
          </div>

          {/* Warning check */}
          {syncItems.some(i => !i.transcodedExists) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
              <AlertTriangle size={12} />
              Warning: Some transcoded files could not be found on disk.
            </div>
          )}
        </div>

        <div className="modal-body" style={{ flex: 1, padding: 0, overflowY: 'auto', background: '#0e1117', maxHeight: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(20, 23, 29, 0.6)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '10px 16px', width: '40px' }}></th>
                <th style={{ padding: '10px 12px' }}>Transcoded Source (Output)</th>
                <th style={{ padding: '10px 12px', width: '100px' }}>Size</th>
                <th style={{ padding: '10px 12px', width: '140px', textAlign: 'center' }}>Sync Action</th>
                <th style={{ padding: '10px 12px', width: '40px' }}></th>
                <th style={{ padding: '10px 12px' }}>Original Target (Library)</th>
                <th style={{ padding: '10px 12px', width: '100px' }}>Size</th>
                <th style={{ padding: '10px 12px', width: '140px' }}>Savings</th>
                <th style={{ padding: '10px 12px', width: '90px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {syncItems.map((item, idx) => {
                const savingBytes = item.originalSize - item.transcodedSize;
                const pctSaved = item.originalSize > 0 ? Math.round((savingBytes / item.originalSize) * 100) : 0;
                
                // Paths parsing
                const sourceDir = item.transcodedFileLocation ? item.transcodedFileLocation.substring(0, item.transcodedFileLocation.lastIndexOf('\\') + 1) : '';
                const sourceName = item.transcodedFileLocation ? item.transcodedFileLocation.substring(item.transcodedFileLocation.lastIndexOf('\\') + 1) : '';
                
                const targetDir = item.file.fullPath ? item.file.fullPath.substring(0, item.file.fullPath.lastIndexOf('\\') + 1) : '';
                const targetName = item.file.fullPath ? item.file.fullPath.substring(item.file.fullPath.lastIndexOf('\\') + 1) : '';

                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid rgba(46, 53, 71, 0.3)', 
                      background: item.selected ? 'rgba(0, 132, 255, 0.02)' : 'rgba(0,0,0,0.15)',
                      opacity: item.selected ? 1 : 0.6,
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.file.fullPath)}
                        disabled={isSyncing}
                      />
                    </td>

                    {/* Source File */}
                    <td style={{ padding: '12px 12px', maxWidth: '300px' }}>
                      {item.transcodedExists ? (
                        <div>
                          <div style={{ color: 'var(--text-bright)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sourceName}>
                            {sourceName}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sourceDir}>
                            {sourceDir}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#ef4444' }}>
                          <div style={{ fontWeight: '600', textDecoration: 'line-through' }}>{item.file.name.replace(/\.[^/.]+$/, '') + ((item.presetFile && item.presetFile.toLowerCase().endsWith('.mp4')) ? '.mp4' : '.mkv')}</div>
                          <span style={{ fontSize: '10px' }}>File missing from output directory</span>
                        </div>
                      )}
                    </td>

                    {/* Source Size */}
                    <td style={{ padding: '12px 12px', color: 'var(--text-bright)' }}>
                      {item.transcodedExists ? formatBytes(item.transcodedSize) : 'N/A'}
                    </td>

                    {/* Sync Action */}
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', borderRadius: '4px', background: 'rgba(28, 32, 42, 0.8)', border: '1px solid var(--border)', padding: '2px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '3px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            background: item.action === 'move' ? 'rgba(46, 196, 182, 0.2)' : 'transparent',
                            color: item.action === 'move' ? '#2ec4b6' : 'var(--text-muted)',
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => handleSetAction(item.file.fullPath, 'move')}
                          disabled={isSyncing}
                        >
                          Move
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '3px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            background: item.action === 'copy' ? 'rgba(0, 132, 255, 0.2)' : 'transparent',
                            color: item.action === 'copy' ? 'var(--accent)' : 'var(--text-muted)',
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => handleSetAction(item.file.fullPath, 'copy')}
                          disabled={isSyncing}
                        >
                          Copy
                        </button>
                      </div>
                    </td>

                    {/* Flow arrow */}
                    <td style={{ padding: '12px 12px', textAlign: 'center', fontSize: '14px', color: item.action === 'move' ? '#2ec4b6' : 'var(--accent)' }}>
                      {item.action === 'move' ? '➔' : '➱'}
                    </td>

                    {/* Target File */}
                    <td style={{ padding: '12px 12px', maxWidth: '300px' }}>
                      <div>
                        <div style={{ color: 'var(--text-bright)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={targetName}>
                          {targetName}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={targetDir}>
                          {targetDir}
                        </div>
                      </div>
                    </td>

                    {/* Target Size */}
                    <td style={{ padding: '12px 12px', color: 'var(--text-bright)' }}>
                      {formatBytes(item.originalSize)}
                    </td>

                    {/* Size Difference */}
                    <td style={{ padding: '12px 12px' }}>
                      {item.transcodedExists ? (
                        savingBytes > 0 ? (
                          <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                            -{formatBytes(savingBytes)} (-{pctSaved}%)
                          </div>
                        ) : (
                          <div style={{ color: '#f44336', fontWeight: 'bold' }}>
                            +{formatBytes(Math.abs(savingBytes))} (+{Math.abs(pctSaved)}%)
                          </div>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      {item.status === 'pending' && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Ready</span>}
                      {item.status === 'syncing' && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                      {item.status === 'success' && <CheckCircle size={14} style={{ color: '#4caf50' }} />}
                      {item.status === 'failed' && (
                        <span 
                          style={{ color: '#f44336', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'help', fontWeight: 'bold' }}
                          title={item.error || 'Unknown error occurred'}
                        >
                          <AlertTriangle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', flexWrap: 'wrap', gap: '16px' }}>
          {/* Stats Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-bright)', fontWeight: 'bold' }}>
              Selected: {selectedItems.length} of {syncItems.length} files 
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
                {" "}({moveCount} to Move, {copyCount} to Copy)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Projected Storage Savings:{" "}
              <strong style={{ color: spaceSavings >= 0 ? '#4caf50' : '#f44336' }}>
                {spaceSavings >= 0 ? '-' : '+'}{formatBytes(Math.abs(spaceSavings))} ({savingsPercent}% saved)
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSyncing}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              style={{ background: '#059669', color: '#fff', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
              onClick={onExecute}
              disabled={isSyncing || selectedItems.length === 0 || selectedItems.some(i => !i.transcodedExists)}
            >
              {isSyncing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Syncing Files...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Start Sync & Replace
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
