import * as vscode from 'vscode';

export interface InputBoxOptions extends vscode.InputBoxOptions {
  allowSpaces?: boolean;
}

/**
 * Simple filename validation utility for Scratchpads extension.
 */
export class InputBox {
  // Valid characters for filenames and extensions
  private static readonly filenameChars = /^[a-zA-Z0-9_.-]$/;
  // Valid characters for display names (includes spaces)
  private static readonly displayNameChars = /^[a-zA-Z0-9_.\s-]$/;

  /**
   * Input box for filenames with basic character filtering
   */
  public static async show(options: InputBoxOptions): Promise<string | undefined> {
    const validChars = options.allowSpaces ? this.displayNameChars : this.filenameChars;
    const result = await this.createFilteredInputBox(options, validChars);
    return result?.replace(/^[\.\s]+/, '').replace(/[\.\s]+$/, '').replace(/\.+/, '.');
  }

  /**
   * Creates a simple filtered input box
   */
  private static createFilteredInputBox(options: InputBoxOptions, allowedChars: RegExp): Promise<string | undefined> {
    return new Promise((resolve) => {
      const inputBox = vscode.window.createInputBox();

      // Copy options
      inputBox.placeholder = options.placeHolder;
      inputBox.prompt = options.prompt;
      inputBox.value = options.value || '';
      inputBox.title = options.title;

      // Simple character filtering
      inputBox.onDidChangeValue((value) => {
        let filtered = '';
        for (const char of value) {
          if (allowedChars.test(char)) {
            filtered += char;
          }
        }
        if (filtered !== value) {
          inputBox.value = filtered;
        }
      });

      inputBox.onDidAccept(() => {
        inputBox.hide();
        resolve(inputBox.value);
      });

      inputBox.onDidHide(() => {
        resolve(undefined);
      });

      inputBox.show();
    });
  }
}
