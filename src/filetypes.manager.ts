import * as vscode from 'vscode';
import { window } from 'vscode';
import { Config } from './config';
import { RECENT_FILE_TYPES_STATE } from './consts';

export interface Filetype {
  name: string;
  ext: string;
}

export interface FiletypeQuickPickItem extends vscode.QuickPickItem {
  type?: Filetype;
}

export class FiletypesManager {
  private recentFiletypes: Filetype[];
  private mainFiletypes: Filetype[];
  private additionalFiletypes: Filetype[];
  private filetypeItems: FiletypeQuickPickItem[];
  private isFiletypeItemsDirty: boolean = false;

  constructor() {
    this.recentFiletypes = Config.context.globalState.get(RECENT_FILE_TYPES_STATE) || [];
    this.mainFiletypes = [];
    this.additionalFiletypes = [];
    this.filetypeItems = [];

    this.loadFiletypes();
  }

  /**
   * Select the type of the scratchpad file
   */
  public async selectFiletype(): Promise<Filetype | undefined> {
    this.prepareItems();

    const selection = await window.showQuickPick(this.filetypeItems);

    if (!selection?.type) {
      return;
    }

    this.addTypeToRecentFiletypes(selection.type);
    return selection.type;
  }

  /**
   * Load the file types based on https://github.com/blakeembrey/language-map
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

    this.mainFiletypes.sort(this.filetypesCompareFn);
    this.additionalFiletypes.sort(this.filetypesCompareFn);
  }

  /**
   * Make sure the file type items are up to date and ordered correctly
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
   * @param {object} typeToAdd
   */
  private addTypeToRecentFiletypes(typeToAdd: Filetype) {
    if (!this.recentFiletypes.length || this.recentFiletypes[0].ext !== typeToAdd.ext) {
      this.recentFiletypes = this.recentFiletypes.filter((type) => {
        return type.ext !== typeToAdd.ext;
      });

      this.recentFiletypes.unshift(typeToAdd);
      Config.context.globalState.update(RECENT_FILE_TYPES_STATE, this.recentFiletypes);
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
}
