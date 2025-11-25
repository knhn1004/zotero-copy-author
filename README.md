# Zotero Copy Author

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![license](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](LICENSE)

A Zotero 7 plugin to quickly copy author names and LaTeX citations from selected items.

## Features

- **Copy Authors** — Copy formatted author names (e.g., "Smith & Jones" or "Smith et al.")
- **Copy LaTeX Citation** — Copy `\cite{key}` with proper citation keys from Better BibTeX

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Copy Authors | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Copy LaTeX Citation | `Cmd+Shift+L` | `Ctrl+Shift+L` |

You can also access these functions via right-click context menu on selected items.

## Requirements

- **Zotero 7** (version 7.0 or later)
- **Better BibTeX** (recommended) — For proper citation key support

## Installation

1. Download the latest `.xpi` file from [Releases](https://github.com/knhn1004/zotero-copy-author/releases)
2. In Zotero, go to `Tools` → `Add-ons`
3. Click the gear icon and select `Install Add-on From File...`
4. Select the downloaded `.xpi` file

## Usage

### Copy Authors
1. Select one or more items in your Zotero library
2. Press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows/Linux)
3. Author names are copied to clipboard in format:
   - Single author: `Smith`
   - Two authors: `Smith & Jones`
   - Three+ authors: `Smith et al.`
   - Multiple items separated by `;`

### Copy LaTeX Citation
1. Select one or more items in your Zotero library
2. Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows/Linux)
3. Citation is copied as `\cite{key1,key2,...}`

The plugin retrieves citation keys from Better BibTeX. If Better BibTeX is not installed, it falls back to generating keys from author name + year.

## Building from Source

```bash
# Install dependencies
npm install

# Development (hot reload)
npm start

# Build for production
npm run build
```

## License

[AGPL-3.0-or-later](LICENSE)

## Author

Oliver Chou ([@knhn1004](https://github.com/knhn1004))
