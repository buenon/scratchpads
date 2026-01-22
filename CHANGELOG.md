## 0.0.1

- Initial release

## 0.0.2

- Increased actions timeout for high latency environments

## 0.0.3

- Added 'Open scratchpad' functionality

## 0.0.4

- Fixed [issue #2](https://github.com/buenon/scratchpads/issues/2) - command 'scratchpads.openScratchpad' not found
- Fixed [issue #4](https://github.com/buenon/scratchpads/issues/4) - Extension creates 7 XML scratchpads upon install

## 0.0.5

- Changelog updates

## 0.0.6

- Dependencies update due to security vulnerabilities
- Fixed [issue #7](https://github.com/buenon/scratchpads/issues/7) - Use new Global storage path

## 0.0.7

- **⚠️ IMPORTANT MIGRATION NOTE**
- Prior to build 0.0.6, upgrading scratchpads will remove all previously created scratchpads
- Assuming the old extension folder was not removed yet by vscode, you can attempt to retrieve the old scratchpads from `%USERPROFILE%\.vscode\extensions\buenon.scratchpads-<OLD_VERSION>\scratchpads\`
- As of build 0.0.6 the new scratchpads location is `%USERPROFILE%\AppData\Roaming\Code\User\globalStorage\buenon.scratchpads\scratchpads\`

## 0.0.8

- [PR #17](https://github.com/buenon/scratchpads/pull/17) by [@omeryagmurlu](https://github.com/omeryagmurlu) - Added remove single scratchpad feature
- [PR #19](https://github.com/buenon/scratchpads/pull/19) by [@nobodyme](https://github.com/nobodyme) - Create scratchpads with custom file names

## 1.0.0

**🚨 BREAKING CHANGE**

- All previously added custom filetypes will be lost. You'll probably find them in the new list and if not you can re-add them using a new command

**✨ NEW FEATURES**

- Added more file types based on [language-map](https://github.com/blakeembrey/language-map)
- Added new command `Scratchpads: New filetype` for adding new filetypes to the list
- Auto paste clipboard text into newly created scratchpads
- Auto format document (works if auto paste is enabled)
- Specify a custom scratchpads folder (when changing folders the data will not be moved automatically)
- Prompt for filename when creating a new scratchpad is now optional (default off)

## 1.0.1

- [#3](https://github.com/buenon/scratchpads/issues/3) - Added command to open latest scratchpad
- [#37](https://github.com/buenon/scratchpads/issues/37) - Added ability to rename scratchpads
- [#41](https://github.com/buenon/scratchpads/issues/41) - Added default filetype configuration
- [#42](https://github.com/buenon/scratchpads/issues/42) - Added scratchpad prefix configuration

## 1.1.0

- [#54](https://github.com/buenon/scratchpads/issues/54) - Load configuration in the correct order (workspace > user > default)
- Dependencies updated to address security vulnerabilities

## 1.2.0

**✨ NEW FEATURES**

- Explorer Integration ([#62](https://github.com/buenon/scratchpads/issues/62)) - Display scratchpad files directly in VSCode Explorer panel
- File management with inline rename and delete buttons for scratchpad files
- Quick actions toolbar for easy creation and removal of scratchpads from Explorer
- Global/Project organization - Choose between project-specific or global scratchpad storage
- Configuration options: `scratchpads.showInExplorer` (default: true) and `scratchpads.useSubfolders` (default: true)

**🙏 CONTRIBUTORS**

- [@d0whc3r](https://github.com/d0whc3r) - Thanks for the contribution to the Explorer Integration feature (sorry for missing the initial PR!)
- [@h-ahl](https://github.com/h-ahl) - Thanks for implementing the global/project organization feature

## 1.2.1

- Added sort actions to treeview
- Added treeview item description (size and date)

## 2.0.0

**🚨 BREAKING CHANGES**

- Fixed critical bug in project folder identification that may cause existing scratchpads to not appear in UI after upgrade
- Default behavior changed: Global shared folder is now the default (was project-specific folders)
- 🟢 Your files are safe on disk - use the new "Open scratchpads folder" command to locate them

**🐛 BUG FIXES**

- [#67](https://github.com/buenon/scratchpads/issues/67) - Fixed filename validation to prevent invalid characters and subdirectory creation
- [#69](https://github.com/buenon/scratchpads/issues/69) - Fixed project path calculation to use workspace folder path instead of VS Code installation path

**✨ NEW FEATURES**

- New command: `Scratchpads: Open scratchpads folder` with cross-platform support
- New command: `Scratchpads: Remove custom filetype` to clean up your custom filetype list
- One-time popup informs users and helps them locate existing files after upgrade
- Automatic configuration migration preserves user preferences during setting migration

**📋 CONFIGURATION MIGRATION**

- `useSubfolders: true` becomes `useGlobalFolder: false`
- `useSubfolders: false` becomes `useGlobalFolder: true`

## 2.1.0

**✨ NEW FEATURES**

- [#77](https://github.com/buenon/scratchpads/issues/77) - Filenames now support spaces for better readability and organization
- [#79](https://github.com/buenon/scratchpads/issues/79) - Improve filename counter to be based on filename rather than extension
- [#83](https://github.com/buenon/scratchpads/issues/83) - Added GitHub Sponsors funding configuration to support the project 💖

**🐛 BUG FIXES**

- [#78](https://github.com/buenon/scratchpads/issues/78) - Improved error handling and logging throughout the extension for better reliability

**📝 IMPROVEMENTS**

- [#76](https://github.com/buenon/scratchpads/issues/76) - Improved clarity of v2.0.0 breaking changes section in README
