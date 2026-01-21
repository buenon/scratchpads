import * as path from 'path';
import { Md5 } from 'ts-md5';
import * as vscode from 'vscode';
import {
  CONFIG_SCRATCHPADS_FOLDER,
  CONFIG_USE_GLOBAL_FOLDER,
  CONFIG_USE_SUBFOLDERS,
  GLOBAL_SCRATCHPADS_FOLDER_NAME,
  RECENT_FILETYPES_FILE,
  SCRATCHPADS_FOLDER_NAME,
  STORAGE_V2_BREAKING_CHANGE_SHOWN,
} from './consts';

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
  public static async init(context: vscode.ExtensionContext) {
    try {
      this.context = context;
      this.extensionConfig = vscode.workspace.getConfiguration('scratchpads');
      this.globalPath = context.globalStorageUri.fsPath;
      
      if (!this.globalPath) {
        throw new Error('globalStorageUri.fsPath is undefined');
      }
      
      await this.migrateConfig();
      this.recalculatePaths();
      await this.showV2BreakingChangeNotification();
    } catch (error) {
      console.error('[Scratchpads] Config.init error:', error);
      throw error;
    }
  }

  /**
   * Migrates legacy useSubfolders setting to useGlobalFolder during initialization.
   * Removes the legacy setting after migration.
   */
  private static async migrateConfig(): Promise<void> {
    const legacyConfig = this.extensionConfig.inspect(CONFIG_USE_SUBFOLDERS);

    // Migrate workspace level
    if (legacyConfig?.workspaceValue !== undefined) {
      await this.extensionConfig.update(
        CONFIG_USE_GLOBAL_FOLDER,
        !legacyConfig.workspaceValue,
        vscode.ConfigurationTarget.Workspace,
      );
      await this.extensionConfig.update(CONFIG_USE_SUBFOLDERS, undefined, vscode.ConfigurationTarget.Workspace);
    }

    // Migrate global level
    if (legacyConfig?.globalValue !== undefined) {
      await this.extensionConfig.update(
        CONFIG_USE_GLOBAL_FOLDER,
        !legacyConfig.globalValue,
        vscode.ConfigurationTarget.Global,
      );
      await this.extensionConfig.update(CONFIG_USE_SUBFOLDERS, undefined, vscode.ConfigurationTarget.Global);
    }
  }

  /**
   * Determines whether to use global folder based on workspace and configuration.
   * @param workspaceFolder The current workspace folder path (undefined if no workspace)
   * @returns true if should use global folder, false for project-specific folders
   */
  private static shouldUseGlobalFolder(workspaceFolder: string | undefined): boolean {
    // Always use global folder when no workspace is open
    if (!workspaceFolder) {
      return true;
    }

    // Simply use the new configuration (migration already happened at init)
    return this.getExtensionConfiguration(CONFIG_USE_GLOBAL_FOLDER) as boolean;
  }

  /**
   * Recalculates all path variables based on current configuration.
   * This includes the project path MD5, custom path, scratchpads root path, and project-specific paths.
   * Called when configuration changes or during initialization.
   */
  public static recalculatePaths() {
    try {
      if (!this.globalPath) {
        console.error('[Scratchpads] recalculatePaths: globalPath is undefined');
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;

      this.customPath = this.getExtensionConfiguration(CONFIG_SCRATCHPADS_FOLDER) as string;
      this.scratchpadsRootPath = path.join(this.customPath || this.globalPath, SCRATCHPADS_FOLDER_NAME);
      this.projectPathMD5 = workspaceFolder ? Md5.hashStr(workspaceFolder) : '';

      // Use global folder if configured, otherwise use project-specific folders
      if (this.shouldUseGlobalFolder(workspaceFolder)) {
        this.projectScratchpadsPath = path.join(this.scratchpadsRootPath, GLOBAL_SCRATCHPADS_FOLDER_NAME);
      } else {
        this.projectScratchpadsPath = path.join(this.scratchpadsRootPath, this.projectPathMD5);
      }

      this.recentFiletypesFilePath = path.join(this.scratchpadsRootPath, RECENT_FILETYPES_FILE);
    } catch (error) {
      console.error('[Scratchpads] recalculatePaths error:', error);
      throw error;
    }
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
  public static async setExtensionConfiguration(
    key: string,
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
  ): Promise<void> {
    await this.extensionConfig.update(key, value, target);
  }

  /**
   * Shows a one-time notification about v2.0.0 breaking changes
   */
  public static async showV2BreakingChangeNotification(): Promise<void> {
    // Check if notification was already shown
    const hasShown = this.context.globalState.get(STORAGE_V2_BREAKING_CHANGE_SHOWN, false);
    if (hasShown) {
      return;
    }

    // Show the notification
    const action = await vscode.window.showWarningMessage(
      'Scratchpads v2.0.0: Due to a bugfix, your existing scratchpads may not appear in the UI. Your files are safe on the disk! Refer to the README for more details.',
      'Open Folder',
      'Do not show again',
    );

    if (action === 'Open Folder') {
      // Import Utils dynamically to avoid circular dependency
      const { default: Utils } = await import('./utils');
      await Utils.openScratchpadsFolder();

      // Still mark as shown after opening folder
      await this.context.globalState.update(STORAGE_V2_BREAKING_CHANGE_SHOWN, true);
    } else if (action === 'Do not show again') {
      // Mark as shown so it won't appear again
      await this.context.globalState.update(STORAGE_V2_BREAKING_CHANGE_SHOWN, true);
    }
  }
}
