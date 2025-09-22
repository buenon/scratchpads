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
    const watchPattern = new vscode.RelativePattern(Config.projectScratchpadsPath, '*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

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
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const renameWithExt = Config.getExtensionConfiguration('renameWithExtension');

    const newFileName = await vscode.window.showInputBox({
      placeHolder: 'Enter new filename:',
      value: renameWithExt ? fileName : baseName,
    });

    if (!newFileName) {
      return;
    }

    const finalFileName = renameWithExt ? newFileName : `${newFileName}${fileExt}`;
    const newFilePath = Utils.getScratchpadFilePath(finalFileName);

    if (fs.existsSync(newFilePath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `Scratchpads: A file named "${finalFileName}" already exists.`,
        'Overwrite',
        'Cancel',
      );

      if (overwrite !== 'Overwrite') {
        return;
      }
    }

    try {
      const openEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.fileName === filePath);

      if (openEditor) {
        // File is open - handle tab management
        await openEditor.document.save();
        await vscode.window.showTextDocument(openEditor.document);
        await Utils.closeActiveEditor();

        await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(newFilePath), { overwrite: true });

        const doc = await vscode.workspace.openTextDocument(newFilePath);
        vscode.window.showTextDocument(doc);
      } else {
        // File not open - simple rename
        await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(newFilePath), { overwrite: true });
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
      // Close ALL tabs for this file (including background tabs)
      const fileUri = vscode.Uri.file(filePath);

      // Find all tabs with this file and close them
      for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs) {
          if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath === filePath) {
            await vscode.window.tabGroups.close(tab);
          }
        }
      }

      // Delete the file
      fs.unlinkSync(filePath);
      vscode.window.showInformationMessage(`Scratchpads: Removed ${fileName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Scratchpads: Failed to delete file: ${error}`);
    }
  }
}
