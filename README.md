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
    <img src="https://img.shields.io/badge/FFmpeg-bundled-ff6b35?style=for-the-badge" alt="FFmpeg Bundled" />
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
<img width="2062" height="1166" alt="image" src="https://github.com/user-attachments/assets/5544e920-2e1e-461f-a55d-927d1443db81" />

- Scan entire directories and subdirectories for compatible video files
- Per-file configuration for codec, quality (RF), frame rate, resolution target, audio tracks, and subtitles
- **Folders / List View Toggle** — switch between a flat media list and a Section-Grouped Accordion table grouped by folder hierarchy
- **Smart RF Size Savings Estimator** — real-time estimated output file size and space savings calculation based on original bitrate, RF quality setting, target resolution, and audio streams
- **Per-Row Resolution Selector** — set target output resolution per file (Original, 2160p 4K, 1080p FHD, 720p HD) with automatic aspect-ratio width/height constraints
- **Batch Apply Panel** — apply video codec, quality, frame rate, resolution, audio codec, and per-slot audio/subtitle language settings across all selected files in one click
- Per-slot language dropdowns for audio (up to 10) and subtitles (0–20) — automatic language matching with fallback rules finds the correct track in each file
- **Custom Context Menus** — right-click any file to open in Windows Explorer, rescan individual files mid-session, or adjust transcode settings
- Filter and sort the media library by name, size, codec, Plex compatibility, and transcoded status
- Auto-selects incompatible files for transcoding on scan
- <img width="931" height="938" alt="image" src="https://github.com/user-attachments/assets/d1b1e24d-630e-4b9c-a97d-e69c986423a4" />
- **Async Sync Operations** — manually sync back transcoded files to overwrite originals to save space with background async file operations and free-space verification

### ⚙️ Encoding Options
<img width="2879" height="360" alt="image" src="https://github.com/user-attachments/assets/84ed84d2-26c1-4fbc-a0f2-723b80864885" />

- **Video:** H.264 or H.265 with configurable RF quality (10–30)
- **Resolution:** Original, 2160p (4K), 1080p (FHD), 720p (HD) with automatic downscaling
- **Frame Rate:** Constant or Variable
- **Audio:** AAC, AC3, EAC3, MP3, or Copy — up to 10 tracks with per-slot language matching
- **Subtitles:** 0–20 subtitle tracks with per-slot language matching and external subtitle detection
- **HandBrake Preset Profiles:** Import and use any `.json` HandBrake preset file for full encoder control

### 🔤 Subtitle Conversion Pipeline & Plex Compatibility
- **Text-based Subtitles (ASS, SSA, SubRip SRT, WebVTT):** Automatically extracted and converted to clean SRT via FFmpeg before muxing — marked as Plex-compatible so media servers stream natively without forced video transcoding or burn-in
- **External Subtitle Auto-Detection & Embedding:** Automatically detects companion sidecar subtitle files (`.srt`, `.ass`, `.ssa`, `.vtt`) in the source directory and embeds them directly into the output file during transcoding
- **Interactive Subtitle Preview:** Explicit Subtitle Track selector dropdown and "Show Subtitles" toggle in the Quality Inspector let you visually verify subtitle formatting and positioning on sample clips before running full batch encodes
- **Image-based Subtitles (PGS, VOBSUB):** Passed through directly via HandBrake (lossless pass-through), with clear UI status badges and warnings detailing PGS compatibility
- If FFmpeg is not found, text subtitles fall back to direct passthrough with a warning in the log
- Extracted SRT files are written to `C:\TempHBMG\subtitles\` and cleaned up automatically

### 🔄 Live Queue Management
<img width="2062" height="847" alt="image" src="https://github.com/user-attachments/assets/62cfb4cf-0c5b-4ffd-8413-29b9c4934b75" />

- Start a transcode queue and **add more files while it's running** — no need to stop and restart
- **Scan new folders mid-queue** and merge results into the current scan list without losing progress
- **Refresh** the current scan directory at any time to pick up newly added files
- **Right-Click Queue Actions & Open Folder** — jump directly to active file locations in Explorer or inspect live HandBrake console logs
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
| **Option #1: Transcode to Destination Folder** | Transcodes directly to another output folder preserving library structures. |
| **Option #2: Replace Source Files (Temp Directory)** | Transcodes to a temp folder first, then replaces the source files (highly recommended to prevent duplicates). |

### 📊 Real-Time Monitoring
- Live progress bar, FPS, average FPS, and ETA per file
- Per-file console log viewer with HandBrake output
- Queue drawer showing status of every file: Queued, Staging, Processing, Paused, Completed, Failed
- Pause, resume, or stop individual jobs without affecting the rest of the queue
- Pause / Resume all engines at once

### 🔍 Interactive Quality Inspector
<img width="2848" height="1654" alt="image" src="https://github.com/user-attachments/assets/9d71447a-dd7e-41c3-98cd-97da8174c1b3" />
<img width="2847" height="1642" alt="image" src="https://github.com/user-attachments/assets/be771bab-d3f3-433b-88ab-7f65b5d0d731" />

Compare your original video against a sample transcode **before committing** to a full encode:
- **Dual View Modes:** Toggle between Side-by-Side split screen view and interactive Drag-Slider comparison view
- **Configurable Preview Duration:** Adjust sample clip duration from 1 second up to 30 seconds
- **Subtitle Track Selector & Toggle:** Choose specific subtitle streams and toggle live subtitle overlays directly in the sample preview window
- Scrub to any timestamp in the source file with frame-accurate controls and custom play/pause playback sync
- Choose codec, resolution, and RF value for the sample
- Helps dial in the right quality setting without wasting time on full encodes

### 🔄 Auto-Updater
- Checks GitHub Releases on launch for a newer version
- **Real-Time Download Progress Bar:** Live percentage display, downloaded bytes, and transfer speed indicator
- **Completion Confirmation Screen:** Interactive modal with instant restart checkbox option to launch the updated version immediately
- Downloads and silently installs the update in the background when requested

---

## 🚀 Installation

### Download & Install (Recommended)
1. Go to the **[Latest Release](https://github.com/EndZz-/HBMinigun/releases/latest)** page
2. Download `HBMiniGun_vX.X.X.exe`
3. Run the installer — no admin rights required

> **HandBrakeCLI, MediaInfo, and FFmpeg are all bundled inside the app.** You do not need to install anything separately.

**Install location:** `C:\Users\%USERNAME%\AppData\Local\Programs\hbminigun\`

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
| [FFmpeg](https://ffmpeg.org/) | Subtitle extraction and conversion (bundled) |
| [Lucide React](https://lucide.dev/) | Icon library |

---

## 📋 Changelog Highlights

| Version | Highlights |
|---|---|
| **v1.3.4** | Fixed app auto-restart after installer update completes; set new cyan/blue minigun logo across window titlebar, taskbar, build icons (.ico/.png), and app header |
| **v1.3.3** | Increased default transcode options panel height (380px) to fit all controls without scrolling; updated application branding logos |
| **v1.3.2** | Live MediaInfo scan progress file counter (e.g. 30 / 11528) and increased MediaInfo concurrency pool to 40 parallel streams |
| **v1.3.1** | User-friendly log & UI error formatting for file locks (Original file locked, unable to delete), HandBrake exit codes, and 3-attempt file deletion retry |
| **v1.3.0** | Structured disk logging (hbminigun.log), automatic session state persistence, "Recall Last Session" header button, App Logs viewer modal, and renderer memory optimizations for multi-day continuous batch runs |
| **v1.2.3** | Real-time download progress bar & completion confirmation screen with restart checkbox in update modal |
| **v1.2.2** | Text subtitles (ASS, SSA, SubRip/SRT, WebVTT) marked as Plex compatible |
| **v1.2.0** | Subtitle Track selector & Show Subtitles toggle added to Interactive Quality Inspector |
| **v1.1.8** | External subtitle auto-detection/sidecar embedding, right-click file rescan & PGS warning indicators |
| **v1.1.6** | Right-click "Show in Folder" context menus & Open Folder button for active queue items |
| **v1.1.5** | Media Library Folders / List View toolbar toggle for section-grouped accordion tables |
| **v1.1.3** | Smart RF size savings estimation engine & section-grouped accordion view |
| **v0.9.5** | CI: split build and upload steps — eliminates upload race condition and timeout |
| **v0.9.x** | FFmpeg bundled (via Git LFS); subtitle ASS/SSA→SRT conversion pipeline |
| **v0.8.8** | Subtitle extraction pipeline; ffmpeg detection and custom path in Settings |
| **v0.8.x** | Batch Apply panel redesigned — per-slot audio and subtitle language dropdowns (up to 10 audio, 0–20 subtitle slots) |
| **v0.5.7** | Fix: UNC engine count off-by-two — stopped double-counting actively-transcoding files in in-flight cap |
| **v0.5.5** | Fix: UNC pipeline hang after first file — staged file object stored directly instead of looked up in empty queue |
| **v0.5.4** | Fix: Option 1 / Option 2 routing corrected — UNC staging only affects input path, not output destination |
| **v0.5.3** | Fix: UNC staging stages one file at a time respecting maxEngines, not all at once |
| **v0.5.0** | Network-aware UNC/mapped-drive pipeline with local staging and serialized network I/O |
| **v0.4.1** | Refresh current scan + Scan New Folder while queue is running |
| **v0.4.0** | Live queue management: add files while transcoding, dynamic engine scaling |
| **v0.3.9** | HandBrakeCLI, MediaInfo & FFmpeg bundled and unpacked correctly on install |

---

## 🙏 Acknowledgements
"This app makes use of FFmpeg and HandBrakeCLI (licensed under GPL/LGPL). Links to their source code can be found | [FFmpeg](https://ffmpeg.org/) | Subtitle extraction and conversion (bundled) | and | [HandBrakeCLI](https://handbrake.fr/) | Video transcoding engine (bundled) |."

Huge shoutout to the original **[HBBatchBeast](https://github.com/JonnyBanana/HBBatchBeast)** project — it set the standard for HandBrake batch GUI wrappers, and HBMiniGun was built to carry that torch forward.

---

## ⚖️ Open Source & Licensing

HBMiniGun is an independent frontend wrapper that launches external binaries to perform media analysis and transcoding. Our compiled releases bundle pre-compiled binaries of the following open-source tools:

*   **HandBrakeCLI** - Licensed under the [GNU General Public License v2 (GPLv2)](https://github.com/HandBrake/HandBrake/blob/master/COPYING). Source code is available at [HandBrake/HandBrake](https://github.com/HandBrake/HandBrake).
*   **FFmpeg** - Licensed under the [GNU Lesser General Public License v2.1 (LGPLv2.1) / GNU General Public License v3 (GPLv3)](https://ffmpeg.org/legal.html). Source code is available at [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg).
*   **MediaInfo** - Licensed under the [BSD 2-Clause License](https://mediaarea.net/en/MediaInfo/License). Source code is available at [MediaArea/MediaInfo](https://github.com/MediaArea/MediaInfo).

HBMiniGun itself is distributed as open-source software. The inclusion of these third-party tools is governed by their respective licenses, and source code for all bundled utilities can be obtained directly from their official repositories linked above.
