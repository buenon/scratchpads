import * as vscode from 'vscode';

export class ScratchpadTreeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<string | undefined | null | void>();
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
    // Return empty array for now - will implement file reading in next task
    return Promise.resolve([]);
  }
}