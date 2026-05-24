# Salesforce CLI Login Helper

A Chrome extension that turns the current Salesforce session into a ready-to-paste `sf org login access-token` command.

## What It Does

- Right-click any supported Salesforce page.
- Capture the current session token from the browser.
- Generate a shell-ready login command for PowerShell, Command Prompt, or Bash.
- Optionally copy a frontdoor URL for direct browser redirect back to the current page.

## Features

- Fast context-menu launch from Salesforce pages.
- Alias field for the target org name.
- Optional project path to set the org as default in that folder.
- Frontdoor copy option with an unchecked default state.
- No helper server or local runtime required.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the root folder of this extension on your machine.

## Use

1. Open a Salesforce org page in Chrome.
2. Right-click and choose `Generate Salesforce CLI command`.
3. Enter an alias.
4. Choose your shell.
5. Add a project path only if you want `--set-default`.
6. Leave the redirect checkbox unchecked if you want the frontdoor URL without `retURL`.
7. Check the redirect box if you want the current page included as `retURL`.
8. Copy the command or frontdoor URL.

## Behavior

- If the project path is empty, the command authorizes with alias only.
- If the project path is set, the command changes into that folder and includes `--set-default`.
- If the redirect box is unchecked, the copied frontdoor URL contains only `sid`.
- If the redirect box is checked, the copied frontdoor URL includes the current page as `retURL`.

## Main Files

- `src/background.js` - Context-menu logic and Salesforce session capture.
- `src/overlay.js` - Overlay UI, command generation, and copy actions.
- `src/options.html` - Project landing page.
- `manifest.json` - Chrome extension manifest.
