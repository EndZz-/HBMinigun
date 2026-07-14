# setup-binaries.ps1
# Automates setting up HandBrakeCLI and MediaInfo in the local project's bin folder.

$binDir = Join-Path $PSScriptRoot "bin"
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

echo "=== Setting up local binaries for HB Minigun ==="
echo "Target directory: $binDir"
echo ""

# 1. Setup HandBrakeCLI
$hbLocalPath = Join-Path $binDir "HandBrakeCLI.exe"
if (Test-Path $hbLocalPath) {
    echo "[HandBrakeCLI] Already exists in local bin."
} else {
    # Check if they have the CLI in PATH or standard folder first to copy
    $hbInstalledPath = "C:\Program Files\HandBrake\HandBrakeCLI.exe"
    if (Test-Path $hbInstalledPath) {
        echo "[HandBrakeCLI] Found in C:\Program Files. Copying locally..."
        Copy-Item $hbInstalledPath $hbLocalPath -Force
    } else {
        echo "[HandBrakeCLI] Downloading from official HandBrake GitHub release (v1.8.2)..."
        $hbZipUrl = "https://github.com/HandBrake/HandBrake/releases/download/1.8.2/HandBrakeCLI-1.8.2-win-x86_64.zip"
        $tempZip = Join-Path $env:TEMP "HandBrakeCLI_temp.zip"
        $tempExtractDir = Join-Path $env:TEMP "HandBrakeCLI_extract"
        
        try {
            Invoke-WebRequest -Uri $hbZipUrl -OutFile $tempZip -UseBasicParsing
            
            if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Recurse -Force | Out-Null }
            New-Item -ItemType Directory -Path $tempExtractDir | Out-Null
            
            Expand-Archive -Path $tempZip -DestinationPath $tempExtractDir -Force
            
            $hbExe = Get-ChildItem -Path $tempExtractDir -Filter "HandBrakeCLI.exe" -Recurse | Select-Object -First 1
            if ($hbExe) {
                Copy-Item $hbExe.FullName $hbLocalPath -Force
                echo "[HandBrakeCLI] Successfully installed in local bin."
            } else {
                throw "HandBrakeCLI.exe not found in extracted zip archive."
            }
        } catch {
            echo "[ERROR] HandBrakeCLI download/install failed: $_"
        } finally {
            if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
            if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Recurse -Force }
        }
    }
}
echo ""

# 2. Setup MediaInfo CLI (CRITICAL: Do NOT copy the GUI version from Program Files, as it crashes Node spawn)
$miLocalPath = Join-Path $binDir "MediaInfo.exe"
# Force overwrite if we want to replace the GUI version that was copied previously
$isExistingMiGui = $false
if (Test-Path $miLocalPath) {
    # Check size of existing MediaInfo.exe. GUI version is ~9.9MB (9929624 bytes), CLI is ~1.5MB to 6MB.
    # In C:\Program Files\MediaInfo\ it was 9,929,624 bytes. Let's check if the size matches exactly.
    $size = (Get-Item $miLocalPath).Length
    if ($size -gt 8MB) {
        echo "[MediaInfo] Local file is GUI version. Forcing CLI replacement..."
        $isExistingMiGui = $true
    }
}

if ((Test-Path $miLocalPath) -and (!$isExistingMiGui)) {
    echo "[MediaInfo] CLI already exists in local bin."
} else {
    echo "[MediaInfo] Downloading official CLI version from MediaInfo repository..."
    $miZipUrl = "https://mediaarea.net/download/binary/mediainfo/24.06/MediaInfo_CLI_24.06_Windows_x64.zip"
    $tempZip = Join-Path $env:TEMP "MediaInfo_temp.zip"
    $tempExtractDir = Join-Path $env:TEMP "MediaInfo_extract"
    
    try {
        Invoke-WebRequest -Uri $miZipUrl -OutFile $tempZip -UseBasicParsing
        
        if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Recurse -Force | Out-Null }
        New-Item -ItemType Directory -Path $tempExtractDir | Out-Null
        
        Expand-Archive -Path $tempZip -DestinationPath $tempExtractDir -Force
        
        $miExe = Get-ChildItem -Path $tempExtractDir -Filter "MediaInfo.exe" -Recurse | Select-Object -First 1
        if ($miExe) {
            Copy-Item $miExe.FullName $miLocalPath -Force
            echo "[MediaInfo] CLI successfully installed in local bin."
        } else {
            throw "MediaInfo.exe not found in extracted zip archive."
        }
    } catch {
        echo "[ERROR] MediaInfo download/install failed: $_"
    } finally {
        if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
        if (Test-Path $tempExtractDir) { Remove-Item $tempExtractDir -Recurse -Force }
    }
}

echo ""
echo "=== Setup Completed ==="
