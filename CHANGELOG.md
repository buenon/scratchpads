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
    Assuming the old extension folder was not removed yet by vscode, you can attempt to retrieve the old scratchpads from %USERPROFILE%\\.vscode\\extensions\\buenon.scratchpads-<OLD_VERSION>\\scratchpads\\  
    As of build 0.0.6 the new scratchpads location is %USERPROFILE%\\AppData\\Roaming\\Code\\User\\globalStorage\\buenon.scratchpads\\scratchpads\\

## 0.0.8
- [PR #17](https://github.com/buenon/scratchpads/pull/17) - [@omeryagmurlu](https://github.com/omeryagmurlu) - Added remove single scratchpad feature
- [PR #19](https://github.com/buenon/scratchpads/pull/19) - [@nobodyme](https://github.com/nobodyme) - Create scratchpads with custom file names
