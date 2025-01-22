# Scratchpads README

Create multiple scratchpad files for doodling while you're coding.

| NOTE: Version 1.0.0 and above, please review the changelog for breaking changes before upgrading |
|-----------------------------------------------------------------------------------------|

## Highlights

* Create multiple scratchpads
* Create scratchpads of different languages and file types (based on https://github.com/blakeembrey/language-map)
* Enjoy VSCode intellisense in your scratchpads
* Scratchpads are not interfering with your project / source control and can be removed at any time

![Create new Scratchpad](https://raw.githubusercontent.com/buenon/scratchpads/master/images/scratchpad_new.gif)

## Available Commands

* `Scratchpads: New scratchpad`
* `Scratchpads: New scratchpad (default)`
* `Scratchpads: Open scratchpad`
* `Scratchpads: Rename scratchpad`
* `Scratchpads: Open latest scratchpad`
* `Scratchpads: New filetype`
* `Scratchpads: Remove scratchpad`
* `Scratchpads: Remove all scratchpads`  
  *Removing all scratchpad files loops through all the open tabs and closes the scratchpad ones before deleting the
  files (might seem weird)*

## Keyboard Shortcuts

You can find instructions on adding shortcuts to the commands above
on [VSCode website](https://code.visualstudio.com/docs/customization/keybindings).

## Extension Settings

Available extension configuration:

* `Auto Format` - Automatically format the new scratchpad content (works only if auto paste is on)
* `Auto Paste` - Automatically paste clipboard content into the new scratchpad
* `Default Filetype` - The default file extension to use with 'New scratchpad (default)' command (e.g., 'js', 'ts', 'py')
* `File Prefix` - The prefix to use when creating new scratchpad files (default: 'scratch')
* `Prompt For Filename` - Prompt the user for a file name when creating a new scratchpad
* `Prompt For Removal` - Prompt the user when removing all scratchpads
* `Scratchpads Folder` - A custom full path in which the scratchpads will be stored (Note: Data will not be moved)
* `Rename With Extension` - Include the file extension when renaming a scratchpad

## Source

[GitHub](https://github.com/buenon/scratchpads)

## License

[MIT](https://raw.githubusercontent.com/buenon/scratchpads/master/LICENSE)
