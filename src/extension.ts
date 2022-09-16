import * as vscode from 'vscode';
import { Config } from './config';
import { FiletypesManager } from './filetypes.manager';
import { ScratchpadsManager } from './scratchpads.manager';
import Utils from './utils';

/**
 * This method is called when the extension is activated
 * Good place for initialization.
 */
export function activate(context: vscode.ExtensionContext) {
  Config.init(context);
  Utils.createFolders();

  const scratchpadsManager = new ScratchpadsManager(new FiletypesManager());

  const commands: { [key: string]: (...args: any[]) => any } = {
    'scratchpads.newScratchpad': () => scratchpadsManager.createScratchpad(),
    'scratchpads.openScratchpad': () => scratchpadsManager.openScratchpad(),
    'scratchpads.removeAllScratchpads': () => scratchpadsManager.removeAllScratchpads(),
    'scratchpads.removeScratchpad': () => scratchpadsManager.removeScratchpad(),
  };

  for (const command in commands) {
    const cmd = vscode.commands.registerCommand(command, commands[command]);
    context.subscriptions.push(cmd);
  }
}

/**
 * This method is called when the extension is deactivated.
 * Good place for cleanups.
 */
export function deactivate() {}
