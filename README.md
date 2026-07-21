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
<img width="2879" height="1628" alt="image" src="https://github.com/user-attachments/assets/8d186503-87b3-4ad4-837c-17a2b8f51525" />

- Scan entire directories and subdirectories for compatible video files
- Per-file configuration for codec, quality (RF), frame rate, audio tracks, and subtitles
- **Batch Apply panel** — apply video codec, quality, frame rate, audio codec, and per-slot audio/subtitle language settings across all selected files in one click
- Per-slot language dropdowns for audio (up to 10) and subtitles (0–20) — language matching finds the correct track in each file automatically
- Filter and sort the media library by name, size, codec, Plex compatibility, and transcoded status
- Auto-selects incompatible files for transcoding on scan
- <img width="1300" height="1310" alt="image" src="https://github.com/user-attachments/assets/e832ef3a-c092-462c-9c92-f2eadfb2bee5" />
- Manually Sync back to overwrite original content to make sure you're saving space. Free-File-Sync inspired


### ⚙️ Encoding Options
<img width="2879" height="360" alt="image" src="https://github.com/user-attachments/assets/84ed84d2-26c1-4fbc-a0f2-723b80864885" />

- **Video:** H.264 or H.265 with configurable RF quality (10–30)
- **Frame Rate:** Constant or Variable
- **Audio:** AAC, AC3, EAC3, MP3, or Copy — up to 10 tracks with per-slot language matching
- **Subtitles:** 0–20 subtitle tracks with per-slot language matching
- **HandBrake Preset Profiles:** Import and use any `.json` HandBrake preset file for full encoder control

### 🔤 Subtitle Conversion Pipeline
- **Text-based subtitles (ASS, SSA, SRT, WebVTT):** Automatically extracted and converted to clean SRT via FFmpeg before muxing — eliminates styled/positional subtitle issues that cause Plex transcoding
- **Image-based subtitles (PGS, VOBSUB):** Passed through directly via HandBrake (OCR-free, lossless)
- If FFmpeg is not found, text subtitles fall back to direct passthrough with a warning in the log
- Extracted SRT files are written to `C:\TempHBMG\subtitles\` and cleaned up automatically

### 🔄 Live Queue Management
<img width="2879" height="1183" alt="image" src="https://github.com/user-attachments/assets/9d2f8277-dffc-4444-83d8-16a6481575f4" />

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

Huge shoutout to the original **[HBBatchBeast](https://github.com/JonnyBanana/HBBatchBeast)** project — it set the standard for HandBrake batch GUI wrappers, and HBMiniGun was built to carry that torch forward.
