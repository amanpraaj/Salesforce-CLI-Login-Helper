# Salesforce CLI Login Helper

This Chrome extension lets you right-click on a Salesforce org page and generate a ready-to-paste `sf org login access-token` command.

## Flow

1. Open a Salesforce page in Chrome.
2. Right-click and choose `Generate Salesforce CLI command`.
3. Enter the alias you want.
4. Fill the simple overlay modal on top of the current Salesforce page.
5. Optionally enter a project path if you want the command to change into that folder and set the org as default there.
6. Choose your command style: PowerShell, Command Prompt, or Bash.
7. Copy the generated command and paste it into your terminal.

## Notes

- If you leave the project path empty, the generated command authorizes with alias only.
- If you enter a project path, the generated command changes into that folder and includes `--set-default`.
- The command is copied to your clipboard from the extension page.
- No helper server, VS Code extension, or `npm start` is needed.

## Setup

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the root folder of this extension on your machine, for example `D:\path\to\SF_TO_VS_Extension`.

## Main files

- `src/background.js`: Context-menu logic and session capture.
- `src/overlay.js`: In-page modal, command generation, and clipboard copy.
- `manifest.json`: Chrome extension manifest.
