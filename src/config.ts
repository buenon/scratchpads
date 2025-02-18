import * as path from 'path';
import { Md5 } from 'ts-md5';
import * as vscode from 'vscode';
import { CONFIG_SCRATCHPADS_FOLDER, RECENT_FILETYPES_FILE, SCRATCHPADS_FOLDER_NAME } from './consts';

export class Config {
  public static context: vscode.ExtensionContext;
  private static extensionConfig: vscode.WorkspaceConfiguration;

  public static globalPath: string;
  public static customPath: string;
  public static scratchpadsRootPath: string;
  public static projectPathMD5: string;
  public static projectScratchpadsPath: string;
  public static recentFiletypesFilePath: string;

  /**
   * Initializes the configuration with the given extension context.
   * Sets up global paths and loads extension configuration settings.
   * @param context The VSCode extension context
   */
  public static init(context: vscode.ExtensionContext) {
    this.context = context;
    this.extensionConfig = vscode.workspace.getConfiguration('scratchpads');
    this.projectPathMD5 = Md5.hashStr(vscode.env.appRoot);
    this.globalPath = context.globalStorageUri.fsPath;
    this.recalculatePaths();
  }

  /**
   * Recalculates all path variables based on current configuration.
   * This includes the custom path, scratchpads root path, and project-specific paths.
   * Called when configuration changes or during initialization.
   */
  public static recalculatePaths() {
    this.customPath = this.getExtensionConfiguration(CONFIG_SCRATCHPADS_FOLDER) as string;

    this.scratchpadsRootPath = path.join(this.customPath || this.globalPath, SCRATCHPADS_FOLDER_NAME);
    this.projectScratchpadsPath = path.join(this.scratchpadsRootPath, this.projectPathMD5);
    this.recentFiletypesFilePath = path.join(this.scratchpadsRootPath, RECENT_FILETYPES_FILE);
  }

  /**
   * Retrieves configuration values with proper fallback chain:
   * workspace → global → default value
   * @param key The configuration key to look up
   * @returns The configuration value, or undefined if not found
   */
  public static getExtensionConfiguration(key: string) {
    const config = this.extensionConfig.inspect(key);
    
    if (config?.workspaceValue !== undefined) {
      return config.workspaceValue;
    }
    
    if (config?.globalValue !== undefined) {
      return config.globalValue;
    }
    
    return config?.defaultValue;
  }

  /**
   * Set an extension configuration based on the given key and value.
   * @param key Configuration key
   * @param value Configuration value
   * @param target Configuration target (defaults to Global)
   * @returns Promise that resolves when the configuration is updated
   */
  public static async setExtensionConfiguration(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    await this.extensionConfig.update(key, value, target);
  }
}
