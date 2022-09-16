import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { Config } from './config';
import { FILE_NAME_TEMPLATE, PROMPT_FOR_REMOVAL } from './consts';
import { FiletypesManager } from './filetypes.manager';
import Utils from './utils';

export class ScratchpadsManager {
  private filetypeManager: FiletypesManager;

  constructor(ftm: FiletypesManager) {
    this.filetypeManager = ftm;
  }

  /**
   * Create a new scratchpad file
   * If file name exists increment counter until a new file can be created
   */
  public async createScratchpad() {
    const filetype = await this.filetypeManager.selectFiletype();

    if (filetype) {
      let i = 0;

      let fileNameFromUser = await window.showInputBox({ placeHolder: 'Enter a filename:' });
      if (!fileNameFromUser) {
        fileNameFromUser = FILE_NAME_TEMPLATE;
      }

      let filename = `${fileNameFromUser}${filetype.ext}`;
      let fullPath = path.join(Config.projectScratchpadsPath, filename);

      // Find an available filename
      while (fs.existsSync(fullPath)) {
        i = i + 1;
        filename = `${fileNameFromUser}${i}${filetype.ext}`;
        fullPath = path.join(Config.projectScratchpadsPath, filename);
      }

      fs.writeFileSync(fullPath, '');

      const doc = await vscode.workspace.openTextDocument(fullPath);
      window.showTextDocument(doc);
    }
  }

  /**
   * Re-open a scratchpad file
   */
  public async openScratchpad() {
    let files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('No scratchpads to open');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    let filePath = path.join(Config.projectScratchpadsPath, selection);

    if (fs.existsSync(filePath)) {
      const doc = await vscode.workspace.openTextDocument(filePath);
      vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
    }
  }

  /**
   * Remove a single scratchpad file
   */
  public async removeScratchpad() {
    let files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('No scratchpads to delete');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    let filePath = path.join(Config.projectScratchpadsPath, selection);
    fs.unlinkSync(filePath);

    window.showInformationMessage(`Removed ${selection}`);
  }

  /**
   * Remove all scratchpad files
   */
  public async removeAllScratchpads() {
    if (await this.confirmRemoval()) {
      await this.closeTabs();
      this.deleteScratchpadFiles();
    }
  }

  /**
   * Prompt the user for confirmation before removing scratchpads
   */
  private async confirmRemoval() {
    const isPromptForRemoval = Config.extensionConfig.inspect(PROMPT_FOR_REMOVAL)?.globalValue;

    if (isPromptForRemoval === undefined || isPromptForRemoval) {
      const answer = await window.showWarningMessage(
        'Are you sure you want to remove all scratchpads?',
        { modal: true },
        'Yes',
        'Always',
      );

      if (answer === undefined) {
        return false;
      }

      if (answer === 'Always') {
        Config.extensionConfig.update(PROMPT_FOR_REMOVAL, false, true);
      }
    }

    return true;
  }

  /**
   * Checks if the given tab is holding a scratchpad document
   *
   * @param {TextEditor} editor The tab to inspect
   */
  private isScratchpadEditor(editor?: vscode.TextEditor) {
    if (editor) {
      const editorPath = path.dirname(editor.document.fileName);
      return editorPath === Config.projectScratchpadsPath;
    }

    return false;
  }

  /**
   * Close all open tabs which edit a scratchpad document.
   * Use a "hack" which uses workbench actions (closeActiveEditor and nextEditor)
   * since there is no access to open tabs.
   */
  private async closeTabs() {
    let initial = window.activeTextEditor;
    let curr;

    while (initial && this.isScratchpadEditor(initial)) {
      // Started with a scratchpad tab
      // Close tab until it is not longer a scratchpad tab
      console.log('initial is a scratchpad: ' + initial.document.fileName);

      await Utils.closeActiveEditor();
      initial = window.activeTextEditor;
    }

    if (initial) {
      console.log('initial editor: ' + initial.document.fileName);

      while (initial.document !== curr?.document) {
        // Iterate over open tabs and close scratchpad tabs until we're back to the initial tab
        if (this.isScratchpadEditor(window.activeTextEditor)) {
          await Utils.closeActiveEditor();
        }

        await Utils.nextEditor();

        curr = window.activeTextEditor;
      }

      console.log('Back to initial tab. Stopping operation...');
    } else {
      console.log('No open tabs');
    }
  }

  /**
   * Delete the scratchpad files from the project's scratchpads folder.
   */
  private deleteScratchpadFiles() {
    console.log('Deleting scratchpad files');

    let files = fs.readdirSync(Config.projectScratchpadsPath);

    for (let i = 0, len = files.length; i < len; i++) {
      fs.unlinkSync(path.join(Config.projectScratchpadsPath, files[i]));
    }

    window.showInformationMessage('Removed all scratchpads');
  }
}
