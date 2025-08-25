import * as vscode from 'vscode';
import {Config} from './config';
import {FiletypesManager} from './filetypes.manager';
import {ScratchpadsManager} from './scratchpads.manager';
import {ScratchpadsViewProvider, sortType} from './scratchpads.view';
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
    'scratchpads.renameScratchpad': () => {
      if (Utils.confirmFolder()) {
        scratchpadsManager.renameScratchpad().then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.removeAllScratchpads': () => {
      if (Utils.confirmFolder()) {
        scratchpadsManager.removeAllScratchpads().then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.removeScratchpad': () => {
      if (Utils.confirmFolder()) {
        scratchpadsManager.removeScratchpad().then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.newFiletype': () => Utils.confirmFolder() && scratchpadsManager.newFiletype(),
    // View commands
    'scratchpads.refreshView': () => scratchpadsViewProvider.refresh(),
    'scratchpads.sortByName': () => scratchpadsViewProvider.setSortType(sortType.name),
    'scratchpads.sortByDate': () => scratchpadsViewProvider.setSortType(sortType.date),
    'scratchpads.sortByType': () => scratchpadsViewProvider.setSortType(sortType.type),
    // Context menu commands for view items
    'scratchpads.openScratchpadFromView': (item: any) => {
      if (Utils.confirmFolder() && item?.fileName) {
        scratchpadsManager.openScratchpadByName(item.fileName).then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.renameScratchpadFromView': (item: any) => {
      if (Utils.confirmFolder() && item?.fileName) {
        scratchpadsManager.renameScratchpadByName(item.fileName).then(() => {
          scratchpadsViewProvider.refresh();
        });
      }
    },
    'scratchpads.removeScratchpadFromView': (item: any) => {
      if (Utils.confirmFolder() && item?.fileName) {
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
