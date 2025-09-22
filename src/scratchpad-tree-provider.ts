import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Config } from './config';

export class ScratchpadTreeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<
    string | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    this.setupFileWatcher();
  }

  private setupFileWatcher(): void {
    // Watch the scratchpads directory for changes
    const watchPattern = new vscode.RelativePattern(Config.projectScratchpadsPath, '*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

    // Refresh tree on file create, delete, or change
    this.fileWatcher.onDidCreate(() => this.refresh());
    this.fileWatcher.onDidDelete(() => this.refresh());
    this.fileWatcher.onDidChange(() => this.refresh());
  }

  dispose(): void {
    this.fileWatcher?.dispose();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: string): vscode.TreeItem {
    const filePath = path.join(Config.projectScratchpadsPath, element);
    const treeItem = new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);

    // Set file icon based on extension - VSCode will automatically choose the right icon
    treeItem.resourceUri = vscode.Uri.file(filePath);

    // Add command to open file on click
    treeItem.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [vscode.Uri.file(filePath)],
    };

    // Set context value for inline action buttons (rename/delete)
    treeItem.contextValue = 'scratchpadFile';

    return treeItem;
  }

  getChildren(element?: string): Thenable<string[]> {
    // Return empty array for non-root elements (we only have files at root level)
    if (element) {
      return Promise.resolve([]);
    }

    try {
      // Check if scratchpads directory exists
      if (!fs.existsSync(Config.projectScratchpadsPath)) {
        return Promise.resolve([]);
      }

      // Read files from scratchpad directory (same pattern as ScratchpadsManager.openScratchpad)
      const files = fs.readdirSync(Config.projectScratchpadsPath);
      return Promise.resolve(files);
    } catch (error) {
      console.error('Scratchpads: Error reading directory:', error);
      return Promise.resolve([]);
    }
  }
}
