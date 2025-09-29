import * as fs from 'fs';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { Config } from './config';
import { CONFIG_DEFAULT_FILETYPE } from './consts';
import { InputBox } from './input-box';

export interface Filetype {
  name: string;
  ext: string;
}

export interface FiletypeQuickPickItem extends vscode.QuickPickItem {
  type?: Filetype;
}

export class FiletypesManager {
  private recentFiletypes: Filetype[] = [];
  private mainFiletypes: Filetype[] = [];
  private additionalFiletypes: Filetype[] = [];
  private filetypeItems: FiletypeQuickPickItem[] = [];
  private isFiletypeItemsDirty: boolean = false;

  constructor() {
    this.loadFiletypes();
    this.prepareItems();
  }

  /**
   * Prompts user to select a filetype from available options.
   * Adds selected type to recent filetypes list if chosen.
   * @param placeHolder Optional placeholder text for the quick pick dialog
   * @returns Promise resolving to selected Filetype or undefined if cancelled
   */
  public async selectFiletype(placeHolder?: string): Promise<Filetype | undefined> {
    this.prepareItems();

    const selection = await window.showQuickPick(this.filetypeItems, {
      placeHolder: placeHolder || 'Select filetype',
    });

    if (!selection?.type) {
      return;
    }

    this.addTypeToRecentFiletypes(selection.type);
    return selection.type;
  }

  /**
   * Add a new filetype
   */
  public async newFiletype(): Promise<Filetype | undefined> {
    const ext = await InputBox.show({
      placeHolder: 'Enter file extension',
    });

    if (!ext) {
      window.showInformationMessage('Scratchpads: Canceled...');
    } else {
      const existingFiletype = this.getFileType(ext);

      if (existingFiletype) {
        window.showInformationMessage(`Scratchpads: Extension already exists (${existingFiletype.name})`);
      } else {
        const defaultName = this.normalizeExtension(ext).toUpperCase();
        const name = await InputBox.show({
          placeHolder: `Enter filetype's name (Hit enter for '${defaultName}')`,
          allowSpaces: true,
        });

        if (name !== undefined) {
          const newFileType = {
            name: name || defaultName,
            ext: `.${this.normalizeExtension(ext)}`,
          };

          this.addTypeToRecentFiletypes(newFileType);
          return newFileType;
        }
      }
    }

    return undefined;
  }

  /**
   * Remove a custom filetype from the recent/custom filetypes list
   */
  public async removeFiletype(): Promise<void> {
    // Filter to only show truly custom filetypes (not built-in ones)
    const customFiletypes = this.recentFiletypes.filter((filetype) => !this.isBuiltInFiletype(filetype.ext));

    if (customFiletypes.length === 0) {
      window.showInformationMessage('Scratchpads: No custom filetypes to remove');
      return;
    }

    // Create quick pick items for custom filetypes only
    const items: vscode.QuickPickItem[] = customFiletypes.map((filetype) => ({
      label: filetype.name,
      description: `(${filetype.ext})`,
    }));

    const selection = await window.showQuickPick(items, {
      placeHolder: 'Select a custom filetype to remove',
      matchOnDescription: true,
    });

    if (!selection) {
      return;
    }

    // Remove the selected filetype
    const extensionToRemove = selection.description?.replace('(', '').replace(')', '') || '';
    this.recentFiletypes = this.recentFiletypes.filter((filetype) => filetype.ext !== extensionToRemove);

    // Save updated list
    fs.writeFileSync(Config.recentFiletypesFilePath, JSON.stringify(this.recentFiletypes, undefined, 2));
    this.isFiletypeItemsDirty = true;

    window.showInformationMessage(`Scratchpads: Removed custom filetype ${extensionToRemove}`);
  }

  /**
   * Check if a filetype extension is built-in (from language-map) or custom
   * @param ext The extension to check (with or without leading dot)
   * @returns true if the extension is built-in, false if it's custom
   */
  private isBuiltInFiletype(ext: string): boolean {
    const normalizedExt = this.normalizeExtension(ext);

    // Check main filetypes
    const isInMain = this.mainFiletypes.some((filetype) => this.normalizeExtension(filetype.ext) === normalizedExt);

    // Check additional filetypes
    const isInAdditional = this.additionalFiletypes.some(
      (filetype) => this.normalizeExtension(filetype.ext) === normalizedExt,
    );

    return isInMain || isInAdditional;
  }

  /**
   * Loads and organizes filetypes from language-map package.
   * Separates filetypes into:
   * - Main filetypes (primary language associations)
   * - Additional filetypes (secondary extensions)
   * - Recent filetypes (user's recently used types)
   */
  private loadFiletypes() {
    const langMap: Record<string, any> = require('language-map');

    for (const [name, data] of Object.entries(langMap)) {
      if (data.extensions) {
        this.mainFiletypes.push({
          name,
          ext: data.extensions.shift(),
        });

        for (const ext of data.extensions) {
          // Skip extensions with multiple dots (E.G. .rest.txt)
          if (ext.lastIndexOf('.') > 0) {
            continue;
          }

          const name = ext.substring(1).toUpperCase();
          this.additionalFiletypes.push({
            name,
            ext,
          });
        }
      }
    }

    // Remove duplicate extensions from additionalFiletypes
    this.additionalFiletypes = this.additionalFiletypes.reduce((newArray: Filetype[], currentType) => {
      const found =
        this.mainFiletypes.find((type) => type.ext === currentType.ext) ||
        newArray.find((type) => type.ext === currentType.ext);

      if (!found) {
        newArray.push(currentType);
      }

      return newArray;
    }, []);

    // Load recent Filetypes
    if (fs.existsSync(Config.recentFiletypesFilePath)) {
      const data = fs.readFileSync(Config.recentFiletypesFilePath, 'utf8');
      const filetypes: Filetype[] = JSON.parse(data);

      for (const fileType of filetypes) {
        this.recentFiletypes.push(fileType);
      }
    }

    this.mainFiletypes.sort(this.filetypesCompareFn);
    this.additionalFiletypes.sort(this.filetypesCompareFn);
  }

  /**
   * Prepares the QuickPick items list for filetype selection.
   * Organizes items into sections:
   * - Recent filetypes
   * - All available filetypes (main + additional)
   * Only rebuilds list if items are marked as dirty
   */
  private prepareItems() {
    if (!this.filetypeItems.length || this.isFiletypeItemsDirty) {
      this.filetypeItems = [];
      this.addFiletypeOptionsToSection('Recent', this.recentFiletypes);
      this.addFiletypeOptionsToSection('File types', [
        ...this.filterOutRecentFiletypes(this.mainFiletypes),
        ...this.filterOutRecentFiletypes(this.additionalFiletypes),
      ]);

      this.isFiletypeItemsDirty = false;
    }
  }

  /**
   * Compare function for sorting file types array (used in sort())
   * @param a The first element for comparison.
   * @param b The second element for comparison.
   * @returns '-1/0/1' based on the extension string
   */
  private filetypesCompareFn(a: Filetype, b: Filetype) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }

  /**
   * Add the given file type to the recent array
   * New filetypes are also added to this array making it a hybrid DB for custom and recent filetypes
   * @param {object} typeToAdd The filetype to add
   */
  private addTypeToRecentFiletypes(typeToAdd: Filetype) {
    if (!this.recentFiletypes.length || this.recentFiletypes[0].ext !== typeToAdd.ext) {
      this.recentFiletypes = this.recentFiletypes.filter((type) => {
        return type.ext !== typeToAdd.ext;
      });

      this.recentFiletypes.unshift(typeToAdd);
      fs.writeFileSync(Config.recentFiletypesFilePath, JSON.stringify(this.recentFiletypes, undefined, 2));
      this.isFiletypeItemsDirty = true;
    }
  }

  /**
   * Add an array of file types to the filetypesOptions to be used in QuickPick.
   * It will also add a QuickPickItemKind.Separator with the given title
   * @param sectionTitle The title to the section
   * @param typesToAdd The types array
   */
  private addFiletypeOptionsToSection(sectionTitle: string, typesToAdd: Filetype[]) {
    this.filetypeItems.push({
      label: sectionTitle,
      kind: vscode.QuickPickItemKind.Separator,
    });

    for (const type of typesToAdd) {
      this.filetypeItems.push({ label: `${type.name} (${type.ext})`, type });
    }
  }

  /**
   * Remove all items that already exist in the recentFiletypes array from the given array
   * @param items The array to filter
   * @returns The filtered array
   */
  private filterOutRecentFiletypes(items: Filetype[]) {
    return items.filter((item) => !this.recentFiletypes.find((recent) => recent.ext === item.ext));
  }

  /**
   * Returns a @Filetype object if it exists in the current list
   * @param ext The extension of the Filetype
   * @returns True if the extension exists in the list, otherwise false
   */
  private getFileType(ext: string): Filetype | undefined {
    for (const item of this.filetypeItems) {
      if (item.type && this.normalizeExtension(item.type.ext) === this.normalizeExtension(ext)) {
        return item.type;
      }
    }

    return undefined;
  }

  /**
   * Remove the dot (if exists) and convert to lowercase.
   * Used for comparison.
   * @param ext The extension to normalize
   * @returns The normalized extension
   */
  private normalizeExtension(ext: string): string {
    return ext.replace('.', '').toLowerCase();
  }

  /**
   * Get filetype by extension
   * @param ext The file extension (with or without dot)
   */
  public getDefaultFiletype(): Filetype | undefined {
    const defaultExt = Config.getExtensionConfiguration(CONFIG_DEFAULT_FILETYPE) as string;

    if (!defaultExt) {
      return undefined;
    }

    return this.getFileType(defaultExt);
  }
}
