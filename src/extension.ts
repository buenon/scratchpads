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
  try {
    await Config.init(context);
  } catch (error) {
    console.error('[Scratchpads] Activation failed during Config.init:', error);
    vscode.window.showErrorMessage(`Scratchpads: Failed to initialize. Check Developer Console for details.`);
    return;
  }

  const scratchpadsManager = new ScratchpadsManager(new FiletypesManager());

  // Register tree view
  const treeViewProvider = new ScratchpadTreeProvider();
  const treeView = vscode.window.createTreeView('scratchpads', {
    treeDataProvider: treeViewProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);
  context.subscriptions.push(treeViewProvider);

  /**
   * Wraps a command handler with error handling and optional folder confirmation
   */
  function wrapCommand(
    commandName: string,
    handler: (...args: any[]) => Promise<void> | void,
    requireFolder = true,
  ): (...args: any[]) => Promise<void> | void {
    return async (...args: any[]) => {
      try {
        if (requireFolder && !Utils.confirmFolder()) {
          return;
        }
        await handler(...args);
      } catch (error) {
        console.error(`[Scratchpads] ${commandName} error:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Scratchpads: ${commandName} failed. ${errorMessage}`);
      }
    };
  }

  const commands: { [key: string]: (...args: any[]) => any } = {
    'scratchpads.newScratchpad': wrapCommand('newScratchpad', () => scratchpadsManager.createScratchpad()),
    'scratchpads.newScratchpadDefault': wrapCommand('newScratchpadDefault', () => scratchpadsManager.createScratchpadDefault()),
    'scratchpads.openScratchpad': wrapCommand('openScratchpad', () => scratchpadsManager.openScratchpad()),
    'scratchpads.openLatestScratchpad': wrapCommand('openLatestScratchpad', () => scratchpadsManager.openLatestScratchpad()),
    'scratchpads.renameScratchpad': wrapCommand('renameScratchpad', () => scratchpadsManager.renameScratchpad()),
    'scratchpads.removeAllScratchpads': wrapCommand('removeAllScratchpads', () => scratchpadsManager.removeAllScratchpads()),
    'scratchpads.removeScratchpad': wrapCommand('removeScratchpad', () => scratchpadsManager.removeScratchpad()),
    'scratchpads.newFiletype': wrapCommand('newFiletype', () => scratchpadsManager.newFiletype()),
    'scratchpads.removeFiletype': wrapCommand('removeFiletype', () => scratchpadsManager.removeFiletype()),
    'scratchpads.openFolder': wrapCommand('openFolder', () => Utils.openScratchpadsFolder(), false),
    'scratchpads.tree.rename': wrapCommand('tree.rename', (fileName: string) => treeViewProvider.renameFile(fileName)),
    'scratchpads.tree.delete': wrapCommand('tree.delete', (fileName: string) => treeViewProvider.deleteFile(fileName)),
    'scratchpads.tree.new': wrapCommand('tree.new', () => scratchpadsManager.createScratchpad()),
    'scratchpads.tree.newDefault': wrapCommand('tree.newDefault', () => scratchpadsManager.createScratchpadDefault()),
    'scratchpads.tree.sortByName': () => treeViewProvider.sortByName(),
    'scratchpads.tree.sortByDate': () => treeViewProvider.sortByDate(),
    'scratchpads.tree.sortByType': () => treeViewProvider.sortByType(),
    'scratchpads.tree.removeAll': wrapCommand('tree.removeAll', () => scratchpadsManager.removeAllScratchpads()),
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
