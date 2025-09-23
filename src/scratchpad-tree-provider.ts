import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Config } from './config';
import Utils from './utils';

export class ScratchpadTreeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData = new vscode.EventEmitter<string | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    this.setupFileWatcher();
  }

  private setupFileWatcher(): void {
    // Dispose existing watcher if it exists
    this.fileWatcher?.dispose();

    const watchPattern = new vscode.RelativePattern(Config.projectScratchpadsPath, '*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

    this.fileWatcher.onDidCreate(() => this.refresh());
    this.fileWatcher.onDidDelete(() => this.refresh());
    this.fileWatcher.onDidChange(() => this.refresh());
  }

  dispose(): void {
    this.fileWatcher?.dispose();
  }

  /**
   * Refresh the tree view and update the file watcher when configuration changes
   */
  public refreshOnConfigChange(): void {
    this.setupFileWatcher();
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: string): vscode.TreeItem {
    const filePath = Utils.getScratchpadFilePath(element);
    const treeItem = new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);

    // Use resourceUri for beautiful theme-based file icons
    treeItem.resourceUri = vscode.Uri.file(filePath);

    // Open file on click
    treeItem.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [vscode.Uri.file(filePath)],
    };

    // Enable inline action buttons
    treeItem.contextValue = 'scratchpadFile';

    return treeItem;
  }

  getChildren(element?: string): Thenable<string[]> {
    if (element) {
      return Promise.resolve([]);
    }

    try {
      const files = Utils.getScratchpadFiles();
      return Promise.resolve(files);
    } catch (error) {
      console.error('Scratchpads: Error reading directory:', error);
      return Promise.resolve([]);
    }
  }

  /**
   * Rename a scratchpad file
   */
  public async renameFile(fileName: string): Promise<void> {
    const filePath = Utils.getScratchpadFilePath(fileName);

    const newFileName = await Utils.promptForNewFilename(fileName);
    if (!newFileName) {
      return;
    }

    const fileExt = path.extname(fileName);
    const renameWithExt = Config.getExtensionConfiguration('renameWithExtension');
    const finalFileName = renameWithExt ? newFileName : `${newFileName}${fileExt}`;
    const newFilePath = Utils.getScratchpadFilePath(finalFileName);

    const shouldProceed = await Utils.confirmOverwrite(newFilePath, finalFileName);
    if (!shouldProceed) {
      return;
    }

    try {
      const openEditor = Utils.findOpenEditor(filePath);

      if (openEditor) {
        // File is open - handle tab management
        await openEditor.document.save();
        await vscode.window.showTextDocument(openEditor.document);
        await Utils.closeActiveEditor();
        await Utils.renameFile(filePath, newFilePath);
        await Utils.openFile(newFilePath);
      } else {
        // File not open - simple rename
        await Utils.renameFile(filePath, newFilePath);
      }

      vscode.window.showInformationMessage(`Scratchpads: Renamed to ${finalFileName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Scratchpads: Failed to rename file: ${error}`);
    }
  }

  /**
   * Delete a scratchpad file
   */
  public async deleteFile(fileName: string): Promise<void> {
    const filePath = Utils.getScratchpadFilePath(fileName);

    try {
      await Utils.closeAllTabsForFile(filePath);
      fs.unlinkSync(filePath);
      vscode.window.showInformationMessage(`Scratchpads: Removed ${fileName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Scratchpads: Failed to delete file: ${error}`);
    }
  }
}
