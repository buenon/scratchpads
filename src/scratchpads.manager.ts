import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { Config } from './config';
import {
  CONFIG_AUTO_FORMAT,
  CONFIG_AUTO_PASTE,
  CONFIG_PROMPT_FOR_FILENAME,
  CONFIG_PROMPT_FOR_REMOVAL,
  FILE_NAME_TEMPLATE,
} from './consts';
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
      let baseFilename = FILE_NAME_TEMPLATE;
      const isPromptForFilename = Config.getExtensionConfiguration(CONFIG_PROMPT_FOR_FILENAME);

      if (isPromptForFilename) {
        const filenameFromUser = await window.showInputBox({ placeHolder: 'Enter a filename:' });

        if (filenameFromUser) {
          baseFilename = filenameFromUser;
        }
      }

      let finalFilename = `${baseFilename}${filetype.ext}`;
      let fullPath = path.join(Config.projectScratchpadsPath, finalFilename);

      // Find an available filename
      while (fs.existsSync(fullPath)) {
        i = i + 1;
        finalFilename = `${baseFilename}${i}${filetype.ext}`;
        fullPath = path.join(Config.projectScratchpadsPath, finalFilename);
      }

      const isAutoPaste = Config.getExtensionConfiguration(CONFIG_AUTO_PASTE);
      const isAutoFormat = Config.getExtensionConfiguration(CONFIG_AUTO_FORMAT);
      const data = isAutoPaste ? await vscode.env.clipboard.readText() : '';

      fs.writeFileSync(fullPath, data);

      const doc = await vscode.workspace.openTextDocument(fullPath);
      window.showTextDocument(doc);

      if (isAutoPaste && isAutoFormat) {
        await this.autoFormatDoc(doc);
      }
    }
  }

  /**
   * Re-open a scratchpad file
   */
  public async openScratchpad() {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('No scratchpads to open');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    const filePath = path.join(Config.projectScratchpadsPath, selection);

    if (fs.existsSync(filePath)) {
      const doc = await vscode.workspace.openTextDocument(filePath);
      vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
    }
  }

  /**
   * Remove a single scratchpad file
   */
  public async removeScratchpad() {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('No scratchpads to delete');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    const filePath = path.join(Config.projectScratchpadsPath, selection);
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
   * Automatically format the text inside the given document
   * @param doc the document to format
   */
  private async autoFormatDoc(doc: vscode.TextDocument) {
    const docUri = doc.uri;
    const edit = new vscode.WorkspaceEdit();
    const textEdits = (await vscode.commands.executeCommand(
      'vscode.executeFormatDocumentProvider',
      docUri,
    )) as vscode.TextEdit[];

    for (const textEdit of textEdits) {
      edit.replace(docUri, textEdit.range, textEdit.newText);
    }

    await vscode.workspace.applyEdit(edit);
  }

  /**
   * Check if we should prompt the user for confirmation before removing scratchpads.
   * If the user previously clicked on "Always" no need to prompt, and we can go ahead and remote them.
   */
  private async confirmRemoval() {
    const isPromptForRemoval = Config.getExtensionConfiguration(CONFIG_PROMPT_FOR_REMOVAL);

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
        Config.setExtensionConfiguration(CONFIG_PROMPT_FOR_REMOVAL, false);
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

    const files = fs.readdirSync(Config.projectScratchpadsPath);

    for (let i = 0, len = files.length; i < len; i++) {
      fs.unlinkSync(path.join(Config.projectScratchpadsPath, files[i]));
    }

    window.showInformationMessage('Removed all scratchpads');
  }
}
