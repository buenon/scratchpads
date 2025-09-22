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
export function activate(context: vscode.ExtensionContext) {
  Config.init(context);

  const scratchpadsManager = new ScratchpadsManager(new FiletypesManager());

  // Register tree view if enabled
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
  };

  for (const command in commands) {
    const cmd = vscode.commands.registerCommand(command, commands[command]);
    context.subscriptions.push(cmd);
  }

  vscode.workspace.onDidChangeConfiguration((event) => {
    const affected = event.affectsConfiguration('scratchpads.scratchpadsFolder');

    if (affected) {
      Config.recalculatePaths();
    }
  });
}

/**
 * Extension deactivation handler.
 * Currently no cleanup is needed.
 */
export function deactivate() {}
