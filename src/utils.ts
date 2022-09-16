import { commands } from 'vscode';
import * as fs from 'fs';
import { Config } from './config';
import { ACTIONS_TIMEOUT } from './consts';

export default class Utils {
  public static createFolders() {
    if (!fs.existsSync(Config.projectScratchpadsPath)) {
      fs.mkdirSync(Config.projectScratchpadsPath, { recursive: true });
    }
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
}
