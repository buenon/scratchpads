import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {window} from 'vscode';
import {Config} from './config';
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
import {Filetype, FiletypesManager} from './filetypes.manager';
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
        const filenameFromUser = await window.showInputBox({
          placeHolder: 'Enter a filename:',
        });

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
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to open');
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
   * Opens the most recently modified scratchpad file.
   * Sorts files by modification time and opens the newest one.
   * Shows error message if no scratchpads exist or if opening fails.
   */
  public async openLatestScratchpad() {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to open');
      return;
    }

    try {
      // Get all files with their stats
      const fileStats = files.map((file) => {
        const filePath = path.join(Config.projectScratchpadsPath, file);
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
      const doc = await vscode.workspace.openTextDocument(latestFile.path);
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
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

    await this.performFileRename(currentFilePath, currentFileName, true);
  }

  /**
   * Remove a single scratchpad file
   */
  public async removeScratchpad() {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.length) {
      window.showInformationMessage('Scratchpads: No scratchpads to delete');
      return;
    }

    const selection = await window.showQuickPick(files);

    if (!selection) {
      return;
    }

    await this.performFileRemoval(selection);
  }

  /**
   * Open a specific scratchpad file by filename
   */
  public async openScratchpadByName(fileName: string) {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.includes(fileName)) {
      window.showErrorMessage(`Scratchpads: File ${fileName} not found`);
      return;
    }

    const filePath = path.join(Config.projectScratchpadsPath, fileName);
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false);
  }

  /**
   * Rename a specific scratchpad file by filename
   */
  public async renameScratchpadByName(fileName: string) {
    const currentFilePath = path.join(Config.projectScratchpadsPath, fileName);

    if (!this.validateFileExists(currentFilePath, fileName)) {
      return;
    }

    await this.performFileRename(currentFilePath, fileName, false);
  }

  /**
   * Helper method to perform file rename operations
   */
  private async performFileRename(currentFilePath: string, currentFileName: string, hasActiveEditor: boolean): Promise<void> {
    const newFileName = await this.promptForNewFileName(currentFileName);
    if (!newFileName) {
      return;
    }

    const newFilePath = path.join(Config.projectScratchpadsPath, newFileName);

    if (!this.validateFileOperation(newFilePath)) {
      return;
    }

    try {
      if (hasActiveEditor) {
        // Close the document first to avoid file lock issues
        const activeEditor = window.activeTextEditor;
        if (activeEditor) {
          await activeEditor.document.save();
          await Utils.closeActiveEditor();
        }
      }

      fs.renameSync(currentFilePath, newFilePath);

      if (hasActiveEditor) {
        // Reopen the renamed file
        const doc = await vscode.workspace.openTextDocument(newFilePath);
        window.showTextDocument(doc);
      }

      window.showInformationMessage(`Scratchpads: Renamed to ${newFileName}`);
    } catch (error) {
      window.showErrorMessage(`Scratchpads: Failed to rename file: ${error}`);
    }
  }

  /**
   * Remove a specific scratchpad file by filename
   */
  public async removeScratchpadByName(fileName: string) {
    const files = fs.readdirSync(Config.projectScratchpadsPath);

    if (!files.includes(fileName)) {
      window.showErrorMessage(`Scratchpads: File ${fileName} not found`);
      return;
    }

    await this.performFileRemoval(fileName);
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
   * Prompt user for new filename with proper extension handling
   */
  private async promptForNewFileName(currentFileName: string): Promise<string | undefined> {
    const currentFileExt = path.extname(currentFileName);
    const currentBaseName = path.basename(currentFileName, currentFileExt);
    const renameWithExt = Config.getExtensionConfiguration(CONFIG_RENAME_WITH_EXTENSION);

    const inputValue = renameWithExt ? currentFileName : currentBaseName;

    const newFileName = await window.showInputBox({
      placeHolder: 'Enter new filename:',
      value: inputValue,
    });

    if (!newFileName) {
      return undefined;
    }

    // Determine the final path based on whether extension renaming is allowed
    return renameWithExt ? newFileName : `${newFileName}${currentFileExt}`;
  }

  /**
   * Validate file exists
   */
  private validateFileExists(filePath: string, fileName: string) {
    if (!fs.existsSync(filePath)) {
      window.showErrorMessage(`Scratchpads: File ${fileName} not found`);
      return false;
    }
    return true;
  }

  /**
   * Validate file operation (rename/move)
   */
  private validateFileOperation(targetPath: string) {
    if (fs.existsSync(targetPath)) {
      window.showErrorMessage('Scratchpads: A file with that name already exists');
      return false;
    }
    return true;
  }

  /**
   * Perform file removal with confirmation
   */
  private async performFileRemoval(fileName: string): Promise<void> {
    const answer = await window.showWarningMessage(
      `Are you sure you want to delete ${fileName}?`,
      { modal: true },
      'Delete',
    );

    if (answer !== 'Delete') {
      return;
    }

    const filePath = path.join(Config.projectScratchpadsPath, fileName);
    fs.unlinkSync(filePath);
    window.showInformationMessage(`Scratchpads: Removed ${fileName}`);
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
   * Closes all open scratchpad tabs.
   * Uses a circular iteration strategy since VSCode doesn't provide direct tab access:
   * 1. Starts from active editor
   * 2. Cycles through all tabs
   * 3. Closes scratchpad tabs until returning to starting point
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

    window.showInformationMessage('Scratchpads: Removed all scratchpads');
  }
}
