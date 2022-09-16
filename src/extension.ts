import * as vscode from 'vscode';
import {Config} from './config';
import {FiletypesManager} from './filetypes.manager';
import {ScratchpadsManager} from './scratchpads.manager';
import Utils from './utils';

/**
 * This method is called when the extension is activated
 * Good place for initialization.
 */
export function activate(context: vscode.ExtensionContext) {
  Config.init(context);

  const scratchpadsManager = new ScratchpadsManager(new FiletypesManager());

  const commands: { [key: string]: (...args: any[]) => any } = {
    'scratchpads.newScratchpad': () => Utils.confirmFolder() && scratchpadsManager.createScratchpad(),
    'scratchpads.openScratchpad': () => Utils.confirmFolder() && scratchpadsManager.openScratchpad(),
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
 * This method is called when the extension is deactivated.
 * Good place for cleanups.
 */
export function deactivate() {}
