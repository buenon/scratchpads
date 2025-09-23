# Scratchpads

> **Create multiple scratchpad files for doodling while you're coding**

A powerful VSCode extension that lets you create temporary files for quick notes, code snippets, and experimentation without cluttering your project workspace.

![Create new Scratchpad](https://raw.githubusercontent.com/buenon/scratchpads/master/images/scratchpad_new.gif)

## ✨ Features

### 🚀 **Quick Creation**

- Create scratchpads instantly with any file extension
- Support for 100+ programming languages and file types
- Full VSCode IntelliSense and syntax highlighting
- Never interfere with your project's source control

### 📁 **Smart Organization**

- **Project-specific folders** (default): Each project gets its own scratchpad folder
- **Global scratchpads**: Share scratchpads across all projects
- Custom storage location support
- Automatic folder management

### 🎯 **Explorer Integration**

- View all scratchpads directly in VSCode's Explorer panel
- Rename and delete files with inline buttons
- Quick actions toolbar for instant creation
- Auto-refresh when files change
- Welcome view with helpful guidance

### ⚡ **Smart Automation**

- **Auto Paste**: Automatically paste clipboard content into new scratchpads
- **Auto Format**: Format document content automatically (when auto paste is enabled)
- **Quick Access**: Open your most recent scratchpad instantly
- **Bulk Operations**: Remove all scratchpads with one command

## 🎮 How to Use

### Creating Scratchpads

| Command                                 | Description                                   | Use Case                                       |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `Scratchpads: New scratchpad`           | Create a new scratchpad with custom file type | When you need a specific file extension        |
| `Scratchpads: New scratchpad (default)` | Create using your default file type           | Quick creation with your preferred language    |
| `Scratchpads: Open scratchpad`          | Browse and open existing scratchpads          | When you want to continue working on something |
| `Scratchpads: Open latest scratchpad`   | Open your most recent scratchpad              | Quick access to your last work                 |

### Managing Scratchpads

| Command                               | Description                    | Use Case                               |
| ------------------------------------- | ------------------------------ | -------------------------------------- |
| `Scratchpads: Rename scratchpad`      | Rename any scratchpad file     | Better organization and identification |
| `Scratchpads: Remove scratchpad`      | Delete a specific scratchpad   | Clean up individual files              |
| `Scratchpads: Remove all scratchpads` | Delete all scratchpads at once | Complete cleanup                       |
| `Scratchpads: New filetype`           | Add custom file extensions     | Support for new languages or formats   |

### Explorer Panel (Optional)

Enable `Scratchpads: Show In Explorer` in settings to:

- See all scratchpads in a dedicated tree view
- Use inline rename/delete buttons
- Access quick action toolbar
- Get visual guidance when no scratchpads exist

## ⚙️ Configuration

| Setting                   | Description                           | Default     | Use When                     |
| ------------------------- | ------------------------------------- | ----------- | ---------------------------- |
| **Show In Explorer**      | Display scratchpads in Explorer panel | `false`     | Visual file management       |
| **Use Subfolders**        | Organize by project vs. global        | `true`      | Better organization          |
| **Auto Paste**            | Paste clipboard content automatically | `true`      | Faster workflow              |
| **Auto Format**           | Format document content automatically | `true`      | Clean, readable code         |
| **Default Filetype**      | Default extension for quick creation  | `""`        | You prefer one language      |
| **File Prefix**           | Prefix for new files                  | `"scratch"` | Custom naming convention     |
| **Prompt For Filename**   | Ask for custom names                  | `false`     | You want control over naming |
| **Prompt For Removal**    | Confirm before deleting all           | `true`      | Safety against accidents     |
| **Scratchpads Folder**    | Custom storage location               | Auto        | You want specific location   |
| **Rename With Extension** | Include extension in rename           | `false`     | You want full control        |

> **⚠️ Important**: Settings related to folder location (`Use Subfolders` and `Scratchpads Folder`) do not automatically migrate existing files. When changing these settings, your existing scratchpads will remain in their current location.

## 🎯 Perfect For

- **Quick Prototyping**: Test ideas without creating permanent files
- **Code Snippets**: Save useful code fragments for later reference
- **Learning**: Practice new languages and frameworks
- **Documentation**: Write notes and documentation drafts
- **Debugging**: Isolate and test specific code sections
- **Experimentation**: Try different approaches without cluttering your project

## 🚀 Getting Started

1. **Install** the extension from the VSCode marketplace
2. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **Type** `Scratchpads: New scratchpad` and press Enter
4. **Choose** your file type and start coding!

### Pro Tips 💡

- **Enable Explorer Integration** for visual file management
- **Set a default filetype** for faster creation
- **Use Auto Paste** to quickly capture clipboard content
- **Organize by project** to keep scratchpads separate
- **Add keyboard shortcuts** for your most-used commands

## Source

[GitHub](https://github.com/buenon/scratchpads)

## License

[MIT](https://raw.githubusercontent.com/buenon/scratchpads/master/LICENSE)
