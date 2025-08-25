import * as vscode from 'vscode';
import {Config} from './config';
import {FiletypesManager} from './filetypes.manager';
import {ScratchpadsManager} from './scratchpads.manager';
import {ScratchpadsViewProvider, SortType} from './scratchpads.view';
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
  const scratchpadsViewProvider = new ScratchpadsViewProvider();
  
  // Register the tree data provider
  vscode.window.registerTreeDataProvider('scratchpads', scratchpadsViewProvider);

  const commands: { [key: string]: (...args: any[]) => any } = {
    'scratchpads.newScratchpad': () => {
      if (Utils.confirmFolder()) {
        scratchpadsManager.createScratchpad().then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.newScratchpadDefault': () => {
      if (Utils.confirmFolder()) {
        scratchpadsManager.createScratchpadDefault().then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.openScratchpad': () => Utils.confirmFolder() && scratchpadsManager.openScratchpad(),
    'scratchpads.openLatestScratchpad': () => Utils.confirmFolder() && scratchpadsManager.openLatestScratchpad(),
    'scratchpads.renameScratchpad': () => Utils.confirmFolder() && scratchpadsManager.renameScratchpad(),
    'scratchpads.removeAllScratchpads': () => Utils.confirmFolder() && scratchpadsManager.removeAllScratchpads(),
    'scratchpads.removeScratchpad': () => Utils.confirmFolder() && scratchpadsManager.removeScratchpad(),
    'scratchpads.newFiletype': () => Utils.confirmFolder() && scratchpadsManager.newFiletype(),
    // View commands
    'scratchpads.refreshView': () => scratchpadsViewProvider.refresh(),
    'scratchpads.sortByName': () => scratchpadsViewProvider.setSortType(SortType.Name),
    'scratchpads.sortByDate': () => scratchpadsViewProvider.setSortType(SortType.Date),
    'scratchpads.sortByType': () => scratchpadsViewProvider.setSortType(SortType.Type),
    // Context menu commands for view items
    'scratchpads.openScratchpadFromView': (item: any) => {
      if (item && item.fileName) {
        scratchpadsManager.openScratchpadByName(item.fileName);
      }
    },
    'scratchpads.renameScratchpadFromView': (item: any) => {
      if (item && item.fileName) {
        scratchpadsManager.renameScratchpadByName(item.fileName).then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.removeScratchpadFromView': (item: any) => {
      if (item && item.fileName) {
        scratchpadsManager.removeScratchpadByName(item.fileName).then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
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
