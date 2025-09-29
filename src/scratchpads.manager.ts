import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { Config } from './config';
import {
  CONFIG_AUTO_FORMAT,
  CONFIG_AUTO_PASTE,
  CONFIG_DEFAULT_FILETYPE,
  CONFIG_FILE_PREFIX,
  CONFIG_PROMPT_FOR_FILENAME,
  CONFIG_PROMPT_FOR_REMOVAL,
  CONFIG_RENAME_WITH_EXTENSION,
  DEFAULT_FILE_PREFIX,
} from './consts';
import { Filetype, FiletypesManager } from './filetypes.manager';
import { InputBox } from './input-box';
import Utils from './utils';

export class ScratchpadsManager {
  private filetypeManager: FiletypesManager;

  constructor(ftm: FiletypesManager) {
    this.filetypeManager = ftm;
  }

  /**
   * Creates a new scratchpad file with the specified or selected filetype.
   * Handles:
   * - Custom filename prompting (if enabled)
   * - Automatic file numbering for duplicates
   * - Content pasting and formatting (if enabled)
   * @param filetype Optional predefined filetype, or prompts for selection
   */
  public async createScratchpad(filetype?: Filetype) {
    if (!filetype) {
      filetype = await this.filetypeManager.selectFiletype();
    }

    if (filetype) {
      let i = 0;
      const configPrefix = Config.getExtensionConfiguration(CONFIG_FILE_PREFIX) as string;
      let baseFilename = configPrefix || DEFAULT_FILE_PREFIX;
      const isPromptForFilename = Config.getExtensionConfiguration(CONFIG_PROMPT_FOR_FILENAME);

      if (isPromptForFilename) {
        const filenameFromUser = await InputBox.show({
          placeHolder: 'Enter a filename:',
        });

        if (filenameFromUser) {
          baseFilename = filenameFromUser;
        }
      }

      let finalFilename = `${baseFilename}${filetype.ext}`;
      let fullPath = Utils.getScratchpadFilePath(finalFilename);

      // Find an available filename
      while (fs.existsSync(fullPath)) {
        i = i + 1;
        finalFilename = `${baseFilename}${i}${filetype.ext}`;
        fullPath = Utils.getScratchpadFilePath(finalFilename);
      }

      const isAutoPaste = Config.getExtensionConfiguration(CONFIG_AUTO_PASTE);
      const isAutoFormat = Config.getExtensionConfiguration(CONFIG_AUTO_FORMAT);
      const data = isAutoPaste ? await vscode.env.clipboard.readText() : '';

      fs.writeFileSync(fullPath, data);
      await Utils.openFile(fullPath);

      if (isAutoPaste && isAutoFormat) {
        const doc = await vscode.workspace.openTextDocument(fullPath);
        await this.autoFormatDoc(doc);
      }
    }
  }

  /**
   * Create a new scratchpad with default filetype
   */
  public async createScratchpadDefault() {
    let defaultType = this.filetypeManager.getDefaultFiletype();

    if (!defaultType) {
      defaultType = await this.filetypeManager.selectFiletype('Select default filetype');
      if (defaultType) {
        // Save the selected type as default (without the dot)
        const defaultExt = defaultType.ext.replace('.', '');
        await Config.setExtensionConfiguration(CONFIG_DEFAULT_FILETYPE, defaultExt);
      }
    }

    if (defaultType) {
      await this.createScratchpad(defaultType);
    }
  }

  /**
   * Re-open a scratchpad file
   */
  public async openScratchpad() {
    const files = Utils.getScratchpadFiles();

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to open');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    const filePath = Utils.getScratchpadFilePath(selection);

    if (fs.existsSync(filePath)) {
      await Utils.openFile(filePath);
    }
  }

  /**
   * Opens the most recently modified scratchpad file.
   * Sorts files by modification time and opens the newest one.
   * Shows error message if no scratchpads exist or if opening fails.
   */
  public async openLatestScratchpad() {
    const files = Utils.getScratchpadFiles();

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to open');
      return;
    }

    try {
      // Get all files with their stats
      const fileStats = files.map((file) => {
        const filePath = Utils.getScratchpadFilePath(file);
        return {
          name: file,
          path: filePath,
          mtime: fs.statSync(filePath).mtime,
        };
      });

      // Sort by modification time, most recent first
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Open the most recent file
      const latestFile = fileStats[0];
      await Utils.openFile(latestFile.path);
    } catch (error) {
      window.showErrorMessage(`Scratchpads: Failed to open latest scratchpad: ${error}`);
    }
  }

  /**
   * Rename the current scratchpad file
   */
  public async renameScratchpad() {
    const activeEditor = window.activeTextEditor;

    if (!activeEditor || !this.isScratchpadEditor(activeEditor)) {
      window.showInformationMessage('Scratchpads: Please open a scratchpad file first');
      return;
    }

    const currentFilePath = activeEditor.document.fileName;
    const currentFileName = path.basename(currentFilePath);

    const newFileName = await Utils.promptForNewFilename(currentFileName);
    if (!newFileName) {
      return;
    }

    const fileExt = path.extname(currentFileName);
    const renameWithExt = Config.getExtensionConfiguration(CONFIG_RENAME_WITH_EXTENSION);
    const finalFileName = renameWithExt ? newFileName : `${newFileName}${fileExt}`;
    const newFilePath = Utils.getScratchpadFilePath(finalFileName);

    const shouldProceed = await Utils.confirmOverwrite(newFilePath, finalFileName);
    if (!shouldProceed) {
      return;
    }

    try {
      await activeEditor.document.save();
      await Utils.closeActiveEditor();
      await Utils.renameFile(currentFilePath, newFilePath);
      await Utils.openFile(newFilePath);

      window.showInformationMessage(`Scratchpads: Renamed to ${finalFileName}`);
    } catch (error) {
      window.showErrorMessage(`Scratchpads: Failed to rename file: ${error}`);
    }
  }

  /**
   * Remove a single scratchpad file
   */
  public async removeScratchpad() {
    const files = Utils.getScratchpadFiles();

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to delete');
      return;
    }

    const selection = await window.showQuickPick(files);
    if (!selection) {
      return;
    }

    const filePath = Utils.getScratchpadFilePath(selection);
    fs.unlinkSync(filePath);

    window.showInformationMessage(`Scratchpads: Removed ${selection}`);
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
   * Add a new Filetype
   */
  public async newFiletype() {
    const newFileType = await this.filetypeManager.newFiletype();
    newFileType && (await this.createScratchpad(newFileType));
  }

  /**
   * Remove a custom filetype
   */
  public async removeFiletype() {
    return await this.filetypeManager.removeFiletype();
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

    if (textEdits) {
      for (const textEdit of textEdits) {
        edit.replace(docUri, textEdit.range, textEdit.newText);
      }

      await vscode.workspace.applyEdit(edit);
    }
  }

  /**
   * Check if we should prompt the user for confirmation before removing scratchpads.
   * If the user previously clicked on "Always" no need to prompt, and we can go ahead and remote them.
   */
  private async confirmRemoval() {
    const isPromptForRemoval = Config.getExtensionConfiguration(CONFIG_PROMPT_FOR_REMOVAL);

    if (isPromptForRemoval === undefined || isPromptForRemoval) {
      const answer = await window.showWarningMessage(
        'Scratchpads: Are you sure you want to remove all scratchpads?',
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
   * Closes all open scratchpad tabs
   */
  private async closeTabs() {
    const scratchpadFiles = Utils.getScratchpadFiles();
    const scratchpadPaths = scratchpadFiles.map((file) => Utils.getScratchpadFilePath(file));

    for (const tabGroup of vscode.window.tabGroups.all) {
      for (const tab of tabGroup.tabs) {
        if (tab.input instanceof vscode.TabInputText) {
          const tabPath = tab.input.uri.fsPath;
          if (scratchpadPaths.includes(tabPath)) {
            await vscode.window.tabGroups.close(tab);
          }
        }
      }
    }
  }

  /**
   * Delete the scratchpad files from the project's scratchpads folder.
   */
  private deleteScratchpadFiles() {
    console.log('Deleting scratchpad files');

    const files = Utils.getScratchpadFiles();

    for (const file of files) {
      fs.unlinkSync(Utils.getScratchpadFilePath(file));
    }

    window.showInformationMessage('Scratchpads: Removed all scratchpads');
  }
}
