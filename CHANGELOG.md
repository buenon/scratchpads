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

- Changelog updates
- **_Important Note !!!_**  
  Prior to build 0.0.6, upgrading scratchpads will remove all previously created scratchpads.  
  Assuming the old extension folder was not removed yet by vscode, you can attempt to retrieve the old scratchpads from
  %USERPROFILE%\\.vscode\\extensions\\buenon.scratchpads-<OLD_VERSION>\\scratchpads\\  
  As of build 0.0.6 the new scratchpads location is
  %USERPROFILE%\\AppData\\Roaming\\Code\\User\\globalStorage\\buenon.scratchpads\\scratchpads\\

## 0.0.8

- [PR #17](https://github.com/buenon/scratchpads/pull/17) - [@omeryagmurlu](https://github.com/omeryagmurlu) - Added
  remove single scratchpad feature
- [PR #19](https://github.com/buenon/scratchpads/pull/19) - [@nobodyme](https://github.com/nobodyme) - Create
  scratchpads with custom file names

## 1.0.0

- File Types
  - **_BREAKING CHANGE_**: All previously added custom filetypes will be lost.  
    You'll probably find them in the new list and if not you can re-add them using a new command.
  - Added more file types based on [language-map](https://github.com/blakeembrey/language-map)
  - Added a new command `Scratchpads: New filetype` for adding new filetypes to the list
- New features
  - Auto paste clipboard text into newly created scratchpads
  - Auto format document (_works if auto paste is enabled_)
  - Specify a custom scratchpads folder (_When changing folders the data will not be moved automatically_)
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

- [#62](https://github.com/buenon/scratchpads/issues/62) - **Explorer Integration**: Display scratchpad files directly in the VSCode Explorer panel
  - File management with inline rename and delete buttons
  - Quick actions toolbar for creating and removing scratchpads
  - Configuration option: `scratchpads.showInExplorer` (default: true)
  - [@d0whc3r](https://github.com/d0whc3r) - Opened a PR that unfortunately was missed by me. Sorry about that, and thanks for the contribution!
- **Global/Project Scratchpad Organization**: Choose between project-specific or global scratchpad storage
  - **Project-specific subfolders (default)**: Each project gets its own scratchpad folder
  - **Global scratchpads**: All scratchpads are saved in a single shared folder
  - Configuration option: `scratchpads.useSubfolders` (default: true)
  - Thanks to [@h-ahl](https://github.com/h-ahl) for contributing the feature implementation
