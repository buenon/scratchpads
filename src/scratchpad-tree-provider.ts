import * as vscode from 'vscode';
import { Config } from './config';
import { ScratchpadsManager } from './scratchpads.manager';
import Utils from './utils';

export class ScratchpadTreeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<
    string | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor(private scratchpadsManager?: ScratchpadsManager) {
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
    const filePath = Utils.getScratchpadFilePath(element);
    const treeItem = new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);

    // Use resourceUri to get proper file icons (blue TS, yellow JSON, etc.)
    // This gives us the beautiful, colorful file icons from VSCode themes
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
      // Use Utils helper to get files
      const files = Utils.getScratchpadFiles();
      return Promise.resolve(files);
    } catch (error) {
      console.error('Scratchpads: Error reading directory:', error);
      return Promise.resolve([]);
    }
  }

  /**
   * Rename a scratchpad file from the tree view (STUB)
   * @param fileName The filename to rename
   */
  public async renameFile(fileName: string): Promise<void> {
    vscode.window.showInformationMessage(`Rename clicked: ${fileName}`);
  }

  /**
   * Delete a scratchpad file from the tree view (STUB)
   * @param fileName The filename to delete
   */
  public async deleteFile(fileName: string): Promise<void> {
    vscode.window.showInformationMessage(`Delete clicked: ${fileName}`);
  }
}
