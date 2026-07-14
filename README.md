<div align="center">
  <img src="public/icons.svg" alt="HBMiniGun Logo" width="120" />
  <h1>HBMiniGun</h1>
  <p>A fast, modern, and powerful batch transcoder GUI for HandBrake.</p>
</div>

<br />

## 🌟 Overview
**HBMiniGun** is an Electron-based desktop application designed to streamline the process of batch encoding and transcoding video files using the powerful HandBrake CLI. It provides a sleek, modern UI, giving users the ability to mass-transcode directories of videos with precision. 

*Inspired by the legendary **HBBatchBeast**, HBMiniGun aims to bring batch transcoding into the modern era with improved UI/UX, an interactive quality inspector, and seamless automatic updates.*

## ✨ Features
*   **Batch Directory Processing:** Select an input directory and quickly queue up all compatible video files for processing.
*   **Built-In HandBrake Profiles:** Easily select from popular HandBrake preset profiles or configure custom encoders, framerates, and RF levels.
*   **Interactive Quality Inspector:** A unique side-by-side video viewer that lets you sample individual frames. Compare your original video against your tweaked RF settings *before* you commit to a full transcode!
*   **Advanced Audio & Subtitle Control:** Granularly configure audio tracking and subtitle streams per batch.
*   **Real-time Progress Tracking:** Monitor each file's progress, ETA, and overall batch status through a clean and responsive dashboard.
*   **File Management Actions:** Automatically copy or move completed files to designated output directories to keep your library organized.
*   **Auto-Updater:** Stay up to date automatically! The app checks GitHub for the latest releases and updates itself.

## 🚀 Getting Started

### Installation
1. Go to the [Releases](https://github.com/EndZz-/HBMinigun/releases/latest) page.
2. Download the latest `HBMiniGun_vX.X.X.exe` installer.
3. Run the installer to install the app on your system.

*Note: HandBrake CLI and MediaInfo are bundled inside the app, so there's no need to install them separately!*

### Running from Source
If you prefer to build the app yourself or want to contribute:
```bash
# Clone the repository
git clone https://github.com/EndZz-/HBMinigun.git
cd HBMinigun

# Install dependencies
npm install

# Run the development environment
npm run dev
```

## 🛠️ Built With
*   [Electron](https://www.electronjs.org/) - Desktop application framework
*   [React](https://reactjs.org/) & [Vite](https://vitejs.dev/) - Frontend UI and fast tooling
*   [HandBrakeCLI](https://handbrake.fr/) - The engine behind the transcodes
*   [MediaInfo](https://mediaarea.net/en/MediaInfo) - For deep video/audio file inspection

## 🙏 Acknowledgements
Huge shoutout to the original **HBBatchBeast** project. It set the standard for batch GUI wrappers around HandBrake, and HBMiniGun was built to carry on that torch with a fresh, modern coat of paint.
