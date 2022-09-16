import * as vscode from 'vscode';
import { Md5 } from 'ts-md5';
import * as path from 'path';
import { SCRATCHPADS_FOLDER } from './consts';

export class Config {
  public static context: vscode.ExtensionContext;
  public static extensionConfig: vscode.WorkspaceConfiguration;
  public static globalPath: string;
  public static projectPathMD5: string;
  public static scratchpadsPath: string;
  public static projectScratchpadsPath: string;

  public static init(context: vscode.ExtensionContext) {
    this.context = context;
    this.extensionConfig = vscode.workspace.getConfiguration('scratchpads');
    this.projectPathMD5 = Md5.hashStr(vscode.env.appRoot);
    this.globalPath = context.globalStorageUri.fsPath;
    this.scratchpadsPath = path.join(this.globalPath, SCRATCHPADS_FOLDER);
    this.projectScratchpadsPath = path.join(this.scratchpadsPath, this.projectPathMD5);
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
