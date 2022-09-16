import * as path from 'path';
import { Md5 } from 'ts-md5';
import * as vscode from 'vscode';
import { CONFIG_SCRATCHPADS_FOLDER, RECENT_FILETYPES_FILE, SCRATCHPADS_FOLDER_NAME } from './consts';

export class Config {
  public static context: vscode.ExtensionContext;
  public static extensionConfig: vscode.WorkspaceConfiguration;

  public static globalPath: string;
  public static customPath: string;
  public static scratchpadsRootPath: string;
  public static projectPathMD5: string;
  public static projectScratchpadsPath: string;
  public static recentFiletypesFilePath: string;

  public static init(context: vscode.ExtensionContext) {
    this.context = context;
    this.extensionConfig = vscode.workspace.getConfiguration('scratchpads');
    this.projectPathMD5 = Md5.hashStr(vscode.env.appRoot);
    this.globalPath = context.globalStorageUri.fsPath;
    this.recalculatePaths();
  }

  public static recalculatePaths() {
    this.customPath = this.getExtensionConfiguration(CONFIG_SCRATCHPADS_FOLDER) as string;

    this.scratchpadsRootPath = path.join(this.customPath || this.globalPath, SCRATCHPADS_FOLDER_NAME);
    this.projectScratchpadsPath = path.join(this.scratchpadsRootPath, this.projectPathMD5);
    this.recentFiletypesFilePath = path.join(this.scratchpadsRootPath, RECENT_FILETYPES_FILE);
  }

  /**
   * Get the extension configuration (exposed in package.json) for the given key
   * @param key
   */
  public static getExtensionConfiguration(key: string) {
    const config = this.extensionConfig.inspect(key);
    return config?.globalValue !== undefined ? config.globalValue : config?.defaultValue;
  }

  /**
   * Set an extension configuration based on the given key and value.
   * The configuration will be saved on the global target.
   * @param key
   * @param value
   */
  public static setExtensionConfiguration(key: string, value: any) {
    this.extensionConfig.update(key, value, true);
  }
}
