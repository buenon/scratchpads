import * as vscode from 'vscode';
import { Config } from './config';
import { FiletypesManager } from './filetypes.manager';
import { ScratchpadTreeProvider } from './scratchpad-tree-provider';
import { ScratchpadsManager } from './scratchpads.manager';
import Utils from './utils';

/**
 * Extension activation handler. Sets up:
 * - Configuration initialization
 * - Command registrations
 * - Configuration change listeners
 * @param context The extension context provided by VSCode
 */
export async function activate(context: vscode.ExtensionContext) {
  await Config.init(context);

  const scratchpadsManager = new ScratchpadsManager(new FiletypesManager());

  // Register tree view
  const treeViewProvider = new ScratchpadTreeProvider();
  const treeView = vscode.window.createTreeView('scratchpads', {
    treeDataProvider: treeViewProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);
  context.subscriptions.push(treeViewProvider);

  const commands: { [key: string]: (...args: any[]) => any } = {
    'scratchpads.newScratchpad': () => Utils.confirmFolder() && scratchpadsManager.createScratchpad(),
    'scratchpads.newScratchpadDefault': () => Utils.confirmFolder() && scratchpadsManager.createScratchpadDefault(),
    'scratchpads.openScratchpad': () => Utils.confirmFolder() && scratchpadsManager.openScratchpad(),
    'scratchpads.openLatestScratchpad': () => Utils.confirmFolder() && scratchpadsManager.openLatestScratchpad(),
    'scratchpads.renameScratchpad': () => Utils.confirmFolder() && scratchpadsManager.renameScratchpad(),
    'scratchpads.removeAllScratchpads': () => Utils.confirmFolder() && scratchpadsManager.removeAllScratchpads(),
    'scratchpads.removeScratchpad': () => Utils.confirmFolder() && scratchpadsManager.removeScratchpad(),
    'scratchpads.newFiletype': () => Utils.confirmFolder() && scratchpadsManager.newFiletype(),
    'scratchpads.openFolder': () => Utils.openScratchpadsFolder(),
    'scratchpads.tree.rename': (fileName: string) => Utils.confirmFolder() && treeViewProvider.renameFile(fileName),
    'scratchpads.tree.delete': (fileName: string) => Utils.confirmFolder() && treeViewProvider.deleteFile(fileName),
    'scratchpads.tree.new': () => Utils.confirmFolder() && scratchpadsManager.createScratchpad(),
    'scratchpads.tree.newDefault': () => Utils.confirmFolder() && scratchpadsManager.createScratchpadDefault(),
    'scratchpads.tree.sortByName': () => treeViewProvider.sortByName(),
    'scratchpads.tree.sortByDate': () => treeViewProvider.sortByDate(),
    'scratchpads.tree.sortByType': () => treeViewProvider.sortByType(),
    'scratchpads.tree.removeAll': () => Utils.confirmFolder() && scratchpadsManager.removeAllScratchpads(),
  };

  for (const command in commands) {
    const cmd = vscode.commands.registerCommand(command, commands[command]);
    context.subscriptions.push(cmd);
  }

  vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
    const affectedFolder = event.affectsConfiguration('scratchpads.scratchpadsFolder');
    const affectedGlobalFolder = event.affectsConfiguration('scratchpads.useGlobalFolder');

    if (affectedFolder || affectedGlobalFolder) {
      Config.recalculatePaths();
      // Refresh the tree view to show files from the new path
      treeViewProvider.refreshOnConfigChange();
    }
  });

  // Handle workspace folder changes
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    Config.recalculatePaths();
    treeViewProvider.refreshOnConfigChange();
  });
}

/**
 * Extension deactivation handler.
 * Currently no cleanup is needed.
 */
export function deactivate() {}
