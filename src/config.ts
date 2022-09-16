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
}
