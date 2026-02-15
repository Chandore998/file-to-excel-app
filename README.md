# pgAdmin to Excel Converter

A desktop application that converts pgAdmin sheet files to Excel spreadsheets (.xlsx). Built with Electron (frontend) and Rust (backend).

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Building the Application](#building-the-application)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Features

- ✅ Convert pgAdmin sheet files to Excel (.xlsx) format
- ✅ Cross-platform support (Windows & macOS)
- ✅ User-friendly GUI built with Electron
- ✅ Fast conversion powered by Rust
- ✅ Packaged installers for easy distribution

## Prerequisites

### For All Users:
- **Node.js** (v18 or higher) → [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** → [Download](https://git-scm.com/)

### For Building Rust Backend:
- **Rust** (latest stable) → [Download](https://www.rust-lang.org/tools/install)
- **Cargo** (comes with Rust)

### Operating System Specific:

#### Windows:
- **Visual Studio C++ Build Tools** or **Visual Studio Community**
  - Download from: https://visualstudio.microsoft.com/downloads/
  - During installation, select "Desktop development with C++"

#### macOS:
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```
- **Rust** with macOS support

## Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd file-to-excel-app
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

### Step 3: Install Rust (if not already installed)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env  # For macOS/Linux
```

On Windows, download and run the installer from https://rustup.rs/

### Step 4: Build the Rust Backend

#### Windows:
```bash
npm run build:rust
```

#### macOS/Linux:
```bash
npm run build:rust
```

This compiles the Rust code to native binaries in `rust-core/target/release/`

## Running the Application

### Development Mode

#### Windows:
```bash
npm start
```

#### macOS:
```bash
npm start
```

The application will open with the Electron window showing the File to Excel converter interface.

### Using the Application:
1. **Click "Select Files"** or **drag and drop** pgAdmin sheet files onto the window
2. **Select the pgAdmin sheet file(s)** you want to convert
3. **Click "Convert"** button
4. **Choose a location** to save the Excel file
5. ✅ Your pgAdmin sheet file will be converted to Excel format

## Building the Application

### Create Standalone Installers

#### For Windows:
```bash
npm run build:win
```
Output: `.exe` installer in the `dist/` folder

#### For macOS:
```bash
npm run build:mac
```
Output: `.dmg` installer in the `dist/` folder

#### For Both Platforms:
```bash
npm run build
```

## Project Structure

```
file-to-excel-app/
├── electron/                 # Electron frontend
│   ├── main.js              # Main process
│   ├── preload.js           # Preload script
│   ├── script.js            # Renderer process
│   └── index.html           # UI
├── rust-core/               # Rust backend
│   ├── src/
│   │   └── main.rs          # CSV to Excel converter
│   ├── Cargo.toml           # Rust dependencies
│   └── target/release/      # Compiled binaries
├── package.json             # Node.js dependencies
└── README.md               # This file
```

## Key Dependencies

### Node.js / Electron:
- `electron` ^40.4.1 - Desktop application framework
- `electron-builder` ^26.7.0 - Build and package installers

### Rust:
- `csv` ^1.4.0 - CSV parsing
- `rust_xlsxwriter` ^0.93.0 - Excel file creation
- `base64` ^0.22.1 - Base64 encoding
- `tempfile` ^3.25.0 - Temporary file handling

## Troubleshooting

### Issue: "Rust compiler not found"
**Solution:** Install Rust from https://www.rust-lang.org/tools/install

### Issue: "MSVCP140.dll not found" (Windows only)
**Solution:** Install Visual C++ Redistributable from https://support.microsoft.com/en-us/help/2977003

### Issue: "CSC.exe not found" (Windows only)
**Solution:** Install .NET Framework or use a different code signing approach

### Issue: Application won't start in development
**Solution:** 
1. Delete `node_modules/` folder
2. Run `npm install` again
3. Re-run `npm run build:rust`
4. Try `npm start`

### Issue: Conversion fails with "Converter executable not found"
**Solution:**
1. Ensure Rust is installed: `rustc --version`
2. Rebuild the Rust backend: `npm run build:rust`
3. Check `rust-core/target/release/` folder contains `rust-core.exe` (Windows) or `rust-core` (macOS)

### Issue: macOS app won't start - "Developer cannot be verified"
**Solution:**
1. Go to System Preferences → Security & Privacy
2. Click "Open Anyway" next to the app name
3. Or right-click the app and select "Open"

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review log files in the application directory
3. Create an issue in the repository

