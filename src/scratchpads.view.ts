import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {Config} from './config';

export const sortType = {
  name: 'name',
  date: 'date',
  type: 'type',
} as const;

export type SortType = typeof sortType[keyof typeof sortType];

export class ScratchpadItem extends vscode.TreeItem {
  constructor(
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly fileStats: fs.Stats,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(fileName, collapsibleState);

    this.tooltip = `${fileName}\nModified: ${fileStats.mtime.toLocaleString()}\nSize: ${fileStats.size} bytes`;
    this.description = this.getFileDescription();
    this.contextValue = 'scratchpadFile';
    this.resourceUri = vscode.Uri.file(filePath);

    // Set command to open file on click
    this.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [vscode.Uri.file(filePath)],
    };

    // Set icon based on file extension
    this.iconPath = this.getFileIcon();
  }

  private getFileDescription(): string {
    const ext = path.extname(this.fileName);
    const size = this.formatFileSize(this.fileStats.size);
    const date = this.fileStats.mtime.toLocaleDateString();
    return `${ext} • ${size} • ${date}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private getFileIcon(): vscode.ThemeIcon {
    const ext = path.extname(this.fileName).toLowerCase();
    switch (ext) {
      case '.js':
      case '.jsx':
        return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.yellow'));
      case '.ts':
      case '.tsx':
        return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'));
      case '.py':
        return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.green'));
      case '.json':
        return new vscode.ThemeIcon('symbol-object', new vscode.ThemeColor('charts.orange'));
      case '.md':
        return new vscode.ThemeIcon('markdown', new vscode.ThemeColor('charts.purple'));
      case '.html':
        return new vscode.ThemeIcon('symbol-tag', new vscode.ThemeColor('charts.red'));
      case '.css':
      case '.scss':
      case '.sass':
        return new vscode.ThemeIcon('symbol-color', new vscode.ThemeColor('charts.pink'));
      default:
        return new vscode.ThemeIcon('file');
    }
  }
}

export class ScratchpadsViewProvider implements vscode.TreeDataProvider<ScratchpadItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ScratchpadItem | undefined | null | void> = new vscode.EventEmitter<
    ScratchpadItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<ScratchpadItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private sortType: SortType = sortType.type;
  private sortAscending = true;

  constructor() {
    // Watch for file system changes in scratchpads folder
    this.watchScratchpadsFolder();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setSortType(sortType: SortType): void {
    if (this.sortType === sortType) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortType = sortType;
      this.sortAscending = true;
    }
    this.refresh();
  }

  getTreeItem(element: ScratchpadItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ScratchpadItem): Thenable<ScratchpadItem[]> {
    if (!element) {
      return Promise.resolve(this.getScratchpadFiles());
    }
    return Promise.resolve([]);
  }

  private getScratchpadFiles(): ScratchpadItem[] {
    try {
      if (!fs.existsSync(Config.projectScratchpadsPath)) {
        return [];
      }

      const files = fs.readdirSync(Config.projectScratchpadsPath);
      const scratchpadItems: ScratchpadItem[] = [];

      for (const file of files) {
        const filePath = path.join(Config.projectScratchpadsPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          scratchpadItems.push(new ScratchpadItem(file, filePath, stats, vscode.TreeItemCollapsibleState.None));
        }
      }

      return this.sortFiles(scratchpadItems);
    } catch (error) {
      console.error('Error reading scratchpad files:', error);
      return [];
    }
  }

  private sortFiles(files: ScratchpadItem[]): ScratchpadItem[] {
    return files.sort((a, b) => {
      let comparison = 0;

      switch (this.sortType) {
        case sortType.name:
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case sortType.date:
          comparison = a.fileStats.mtime.getTime() - b.fileStats.mtime.getTime();
          break;
        case sortType.type:
          const extA = path.extname(a.fileName);
          const extB = path.extname(b.fileName);
          comparison = extA.localeCompare(extB);
          if (comparison === 0) {
            comparison = a.fileName.localeCompare(b.fileName);
          }
          break;
      }

      return this.sortAscending ? comparison : -comparison;
    });
  }

  private watchScratchpadsFolder(): void {
    if (fs.existsSync(Config.projectScratchpadsPath)) {
      const watcher = fs.watch(Config.projectScratchpadsPath, (eventType, filename) => {
        if (filename) {
          this.refresh();
        }
      });

      // Clean up watcher when extension is deactivated
      vscode.workspace.onDidChangeConfiguration(() => {
        watcher.close();
      });
    }
  }
}
