<div align="center">
  <img src="public/logo.png" alt="HBMiniGun Logo" width="200" />
  <h1>HBMiniGun</h1>
  <p><strong>A fast, modern, and intelligent batch transcoder built on HandBrake.</strong></p>

  <p>
    <a href="https://github.com/EndZz-/HBMinigun/releases/latest">
      <img src="https://img.shields.io/github/v/release/EndZz-/HBMinigun?style=for-the-badge&logo=github&color=0084ff" alt="Latest Release" />
    </a>
    <a href="https://github.com/EndZz-/HBMinigun/releases/latest">
      <img src="https://img.shields.io/github/downloads/EndZz-/HBMinigun/total?style=for-the-badge&color=2ec4b6" alt="Total Downloads" />
    </a>
    <img src="https://img.shields.io/badge/platform-Windows-blue?style=for-the-badge&logo=windows" alt="Platform: Windows" />
    <img src="https://img.shields.io/badge/HandBrakeCLI-bundled-ffb703?style=for-the-badge" alt="HandBrakeCLI Bundled" />
  </p>
</div>

<br />

---

## 📖 Overview

**HBMiniGun** is an Electron-based desktop application that brings professional-grade batch video transcoding to everyone. Powered by HandBrake CLI and MediaInfo under the hood, it provides a sleek, responsive UI for managing large video libraries — with full per-file configuration, a live transcode queue, network-aware staging, and an interactive quality inspector.

> *Inspired by the legendary **HBBatchBeast**, HBMiniGun carries that torch into the modern era with a complete UI/UX overhaul, live queue management, and intelligent network path handling.*

---

## ✨ Features

### 🎬 Batch Transcoding
- Scan entire directories and subdirectories for compatible video files
- Per-file configuration for codec, quality (RF), frame rate, audio tracks, and subtitles
- Batch-apply settings across all selected files in one click
- Filter and sort the media library by name, size, codec, Plex compatibility, and transcoded status
- Auto-selects incompatible files for transcoding on scan

### ⚙️ Encoding Options
- **Video:** H.264 or H.265 with configurable RF quality (10–30)
- **Frame Rate:** Constant or Variable
- **Audio:** AAC, AC3, EAC3, MP3, or Copy — up to 2 tracks with language matching
- **Subtitles:** Up to 2 subtitle tracks with language matching
- **HandBrake Preset Profiles:** Import and use any `.json` HandBrake preset file for full encoder control

### 🔄 Live Queue Management
- Start a transcode queue and **add more files while it's running** — no need to stop and restart
- **Scan new folders mid-queue** and merge results into the current scan list without losing progress
- **Refresh** the current scan directory at any time to pick up newly added files
- Adjust **concurrent HandBrake engines (1–8) live** while transcoding:
  - Increasing immediately spawns additional workers
  - Decreasing lets running jobs finish and reduces replacements to the new count

### 🌐 Network Path Intelligence (UNC & Mapped Drives)
HBMiniGun automatically detects when source files are on a network location — including raw UNC paths (`\\server\share`) and mapped network drives (`Z:\`) — and switches to a network-optimised pipeline:

```
C:\TempHBMG\
  source\      ← local staged copies of network source files
  transcodes\  ← HandBrake output before move-back
```

**Pipeline behaviour:**
- Files are copied locally **one at a time** (never saturating the network)
- Transcodes run **in parallel** up to the configured engine count while the network is free
- The **next set is prefetched** while the current set transcodes, so the network and CPU are both fully utilized at all times
- On transcode completion, the result is moved back to its destination via a **single serialized network write**
- Stale temp files from a previous session are always overwritten

> Local source paths bypass all of this entirely — no overhead for purely local workflows.

### 📁 Transcode Strategies

| Strategy | Description |
|---|---|
| **Transcode to Destination Folder** | Encode directly to a separate output directory, preserving library folder structure |
| **Replace Source Files (Temp Directory)** | Encode to a local temp folder first, then replace or copy back to the original location — prevents corrupted originals if the process is interrupted |

### 📊 Real-Time Monitoring
- Live progress bar, FPS, average FPS, and ETA per file
- Per-file console log viewer with HandBrake output
- Queue drawer showing status of every file: Queued, Staging, Processing, Paused, Completed, Failed
- Pause, resume, or stop individual jobs without affecting the rest of the queue
- Pause / Resume all engines at once

### 🔍 Interactive Quality Inspector
Compare your original video against a sample transcode **before committing** to a full encode:
- Scrub to any timestamp in the source file
- Choose codec and RF value for the sample
- Side-by-side synchronized playback of original vs. transcoded sample
- Helps dial in the right quality setting without wasting time on full encodes

### 🔄 Auto-Updater
- Checks GitHub Releases on launch for a newer version
- Downloads and silently installs the update in the background
- No user intervention required — restarts to the new version automatically

---

## 🚀 Installation

### Download & Install (Recommended)
1. Go to the **[Latest Release](https://github.com/EndZz-/HBMinigun/releases/latest)** page
2. Download `HBMiniGun_vX.X.X.exe`
3. Run the installer — no admin rights required

> **HandBrakeCLI and MediaInfo are bundled inside the app.** You do not need to install them separately.

**Install location:** `C:\Users\<you>\AppData\Local\Programs\hbminigun\`

---

## 🛠️ Build from Source

```bash
# Clone the repository
git clone https://github.com/EndZz-/HBMinigun.git
cd HBMinigun

# Install dependencies
npm install

# Run in development mode (Vite + Electron)
npm run dev

# Build the production installer
npm run build        # Builds Vite frontend
npm run package      # Packages into a Windows installer
```

---

## 📂 Temp Directory Structure

HBMiniGun uses a local temp directory (default: `C:\TempHBMG\`) for safe intermediate processing:

```
C:\TempHBMG\
  source\        ← temporary local copies of network source files
  transcodes\    ← HandBrake output before final move/copy to destination
```

You can change the temp directory path in **Settings**.

---

## 🧰 Built With

| Technology | Role |
|---|---|
| [Electron](https://www.electronjs.org/) | Desktop application shell |
| [React 19](https://reactjs.org/) | UI framework |
| [Vite](https://vitejs.dev/) | Frontend build tooling |
| [HandBrakeCLI](https://handbrake.fr/) | Video transcoding engine (bundled) |
| [MediaInfo](https://mediaarea.net/en/MediaInfo) | Video/audio stream inspection (bundled) |
| [Lucide React](https://lucide.dev/) | Icon library |

---

## 📋 Changelog Highlights

| Version | Highlights |
|---|---|
| **v0.5.0** | Network-aware UNC/mapped-drive pipeline with local staging and serialized network I/O |
| **v0.4.1** | Refresh current scan + Scan New Folder while queue is running |
| **v0.4.0** | Live queue management: add files while transcoding, dynamic engine scaling |
| **v0.3.9** | HandBrakeCLI & MediaInfo bundled and unpacked correctly on install |
| **v0.3.6** | Compact UI, sticky table headers, consistent category header sizing |
| **v0.3.5** | Larger, more readable table dropdowns |
| **v0.3.3** | Single-release fix (eliminated duplicate GitHub release race condition) |

---

## 🙏 Acknowledgements

Huge shoutout to the original **[HBBatchBeast](https://github.com/JonnyBanana/HBBatchBeast)** project — it set the standard for HandBrake batch GUI wrappers, and HBMiniGun was built to carry that torch forward.
