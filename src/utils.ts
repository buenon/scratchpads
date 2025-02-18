import * as fs from 'fs';
import * as path from 'path';
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
        window.showInformationMessage(`Scratchpads: Invalid scratchpads path given (${Config.customPath}). Check configuration...`);
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
}
