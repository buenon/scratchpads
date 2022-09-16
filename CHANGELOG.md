## 0.0.1

* Initial release

## 0.0.2

* Increased actions timeout for high latency environments

## 0.0.3

* Added 'Open scratchpad' functionality

## 0.0.4

* Fixed [issue #2](https://github.com/buenon/scratchpads/issues/2) - command 'scratchpads.openScratchpad' not found
* Fixed [issue #4](https://github.com/buenon/scratchpads/issues/4) - Extension creates 7 XML scratchpads upon install

## 0.0.5

* Changelog updates

## 0.0.6

* Dependencies update due to security vulnerabilities
* Fixed [issue #7](https://github.com/buenon/scratchpads/issues/7) - Use new Global storage path

## 0.0.7

* Changelog updates
* ***Important Note !!!***  
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
    - ***BREAKING CHANGE***: All previously added custom filetypes will be lost.  
      You'll probably find them in the new list and if not you can re-add them using a new command.
    - Added more file types based on [language-map](https://github.com/blakeembrey/language-map)
    - Added a new command `Scratchpads: New filetype` for adding new filetypes to the list
- New features
    - Auto paste clipboard text into newly created scratchpads
    - Auto format document (*works if auto paste is enabled*)
    - Specify a custom scratchpads folder (*When changing folders the data will not be moved automatically*)
- Prompt for filename when creating a new scratchpad is now optional (default off)

