import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { commands, window } from 'vscode';
import { Config } from './config';
import { ACTIONS_TIMEOUT } from './consts';

export default class Utils {
  /**
   * Ensures the scratchpads directory exists and is writable.
   * Creates the directory if missing and validates path accessibility.
   * @returns boolean indicating if the folder is ready for use
   */
  public static confirmFolder(): boolean {
    if (!fs.existsSync(Config.projectScratchpadsPath)) {
      if (Utils.validateFolderCreatable(Config.projectScratchpadsPath)) {
        fs.mkdirSync(Config.projectScratchpadsPath, { recursive: true });
      } else {
        window.showInformationMessage(
          `Scratchpads: Invalid scratchpads path given (${Config.customPath}). Check configuration...`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Close the current active tab
   */
  public static async closeActiveEditor() {
    commands.executeCommand('workbench.action.closeActiveEditor');
    await this.sleep(ACTIONS_TIMEOUT);
  }

  /**
   * Move to the next tab
   */
  public static async nextEditor() {
    commands.executeCommand('workbench.action.nextEditor');
    await this.sleep(ACTIONS_TIMEOUT);
  }

  /**
   * Sleep for the given duration
   * @param ms Duration in milliseconds
   */
  public static sleep(ms: number) {
    return new Promise((f) => setTimeout(f, ms));
  }

  /**
   * Checks if a folder path is valid and creatable.
   * Traverses up the path tree to find first existing parent.
   * @param p The folder path to validate
   * @returns boolean indicating if the folder can be created
   */
  public static validateFolderCreatable(p: string) {
    const nodes = p.split(path.sep);

    for (let i = nodes.length; i > 0; i--) {
      if (fs.existsSync(nodes.slice(0, i).join(path.sep))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get list of scratchpad files from the project directory
   * @returns Array of filenames, empty if directory doesn't exist
   */
  public static getScratchpadFiles(): string[] {
    if (!fs.existsSync(Config.projectScratchpadsPath)) {
      return [];
    }
    return fs.readdirSync(Config.projectScratchpadsPath);
  }

  /**
   * Get full path for a scratchpad file
   * @param fileName The filename to get path for
   * @returns Full file path
   */
  public static getScratchpadFilePath(fileName: string): string {
    return path.join(Config.projectScratchpadsPath, fileName);
  }

  /**
   * Open a file in VSCode editor
   * @param filePath Full path to the file
   */
  public static async openFile(filePath: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc);
  }

  /**
   * Close all tabs for a specific file
   * @param filePath Full path to the file
   */
  public static async closeAllTabsForFile(filePath: string): Promise<void> {
    for (const tabGroup of vscode.window.tabGroups.all) {
      for (const tab of tabGroup.tabs) {
        if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath === filePath) {
          await vscode.window.tabGroups.close(tab);
        }
      }
    }
  }

  /**
   * Find if a file is currently open in any editor
   * @param filePath Full path to the file
   * @returns The editor if found, undefined otherwise
   */
  public static findOpenEditor(filePath: string): vscode.TextEditor | undefined {
    return vscode.window.visibleTextEditors.find((editor) => editor.document.fileName === filePath);
  }

  /**
   * Rename a file using VSCode's file system API
   * @param oldPath Current file path
   * @param newPath New file path
   */
  public static async renameFile(oldPath: string, newPath: string): Promise<void> {
    await vscode.workspace.fs.rename(vscode.Uri.file(oldPath), vscode.Uri.file(newPath), { overwrite: true });
  }

  /**
   * Show rename input dialog and get new filename
   * @param currentFileName Current filename
   * @returns New filename or undefined if cancelled
   */
  public static async promptForNewFilename(currentFileName: string): Promise<string | undefined> {
    const fileExt = path.extname(currentFileName);
    const baseName = path.basename(currentFileName, fileExt);
    const renameWithExt = Config.getExtensionConfiguration('renameWithExtension');

    return await vscode.window.showInputBox({
      placeHolder: 'Enter new filename:',
      value: renameWithExt ? currentFileName : baseName,
    });
  }

  /**
   * Check if file exists and prompt for overwrite if needed
   * @param filePath Path to check
   * @param fileName Display name for the dialog
   * @returns true if should proceed, false if cancelled
   */
  public static async confirmOverwrite(filePath: string, fileName: string): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
      return true;
    }

    const overwrite = await vscode.window.showWarningMessage(
      `Scratchpads: A file named "${fileName}" already exists.`,
      'Overwrite',
      'Cancel',
    );

    return overwrite === 'Overwrite';
  }
}
