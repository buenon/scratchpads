import * as fs from 'fs';
import * as vscode from 'vscode';
import { Config } from './config';

export class ScratchpadTreeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<
    string | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    // Empty constructor for now
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: string): vscode.TreeItem {
    // This will be implemented in the next task
    return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);
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
