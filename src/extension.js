(() => {
    exports.activate = activate;
    exports.deactivate = deactivate;

    // The module 'vscode' contains the VS Code extensibility API
    // Import the module and reference it with the alias vscode in your code below
    const fs = require('fs');
    const path = require('path');
    const vscode = require('vscode');
    const window = vscode.window;
    const commands = vscode.commands;
    const md5 = require('md5');
    const langMap = require('language-map');


    "use strict";
    const SCRATCHPADS_FOLDER = "scratchpads";
    const FILE_NAME_TEMPLATE = "scratch";
    const RECENT_FILE_TYPES_STATE = "recentFileTypesState";
    const ACTIONS_TIMEOUT = 500; // Need to pause a bit when changing or closing the active tab 
    const PROMPT_FOR_REMOVAL = "promptForRemoval";

    let context;
    let configuration;
    let scratchpadsPath;
    let projectScratchpadsPath;
    let mainFileTypes;
    let additionalFileTypes;
    let recentFileTypes;
    let fileTypesOptions;
    let isFileTypesDirty = false;
    let scratchpadPathRegex;

    // this method is called when your extension is activated
    // your extension is activated the very first time the command is executed
    function activate(ctx) {
        context = ctx;
        init();

        let createCommand = commands.registerCommand('scratchpads.newScratchpad', selectFileType);
        context.subscriptions.push(createCommand);

        let removeAllCommand = commands.registerCommand('scratchpads.removeAllScratchpads', removeAllScratchpads);
        context.subscriptions.push(removeAllCommand);

        let removeOneCommand = commands.registerCommand('scratchpads.removeScratchpad', removeScratchpad);
        context.subscriptions.push(removeOneCommand);

        let openCommand = commands.registerCommand('scratchpads.openScratchpad', openScratchpad);
        context.subscriptions.push(openCommand);
    }

    /**
     * Save state and free up resources
     */
    function deactivate() {
        removeProjectFolderIfEmpty();
    }

    /**
     * Initialization
     */
    function init() {
        let projectPathMD5 = md5(vscode.env.appRoot);

        configuration = vscode.workspace.getConfiguration('scratchpads');
        scratchpadsPath = path.join(context.globalStoragePath, SCRATCHPADS_FOLDER);

        if (!fs.existsSync(context.globalStoragePath)) {
            fs.mkdirSync(context.globalStoragePath);
            fs.mkdirSync(scratchpadsPath);
        }

        projectScratchpadsPath = path.join(scratchpadsPath, projectPathMD5);

        if (!fs.existsSync(projectScratchpadsPath)) {
            fs.mkdirSync(projectScratchpadsPath);
        }

        scratchpadPathRegex = escapeRegExp(
            path.join(
                path.basename(context.globalStoragePath),
                SCRATCHPADS_FOLDER,
                projectPathMD5
            )
        );

        loadFileTypes();
    }

    /**
     * Source reference: https://stackoverflow.com/a/6969486/1324724
     * We need to escape special characters when using string.match()
     *
     * @param {string} str Regex string to escape
     */
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /**
     * Checks if the given tab is holding a scratchpad document
     *
     * @param {TextEditor} editor The tab to inspect
     */
    function isScratchpadEditor(editor) {
        return editor && editor.document.fileName.match(scratchpadPathRegex);
    }

    /**
     * Load the file types
     */
    function loadFileTypes() {
        recentFileTypes = context.globalState.get(RECENT_FILE_TYPES_STATE) || [];
        mainFileTypes = [];
        additionalFileTypes = [];

        for (const [name, data] of Object.entries(langMap)) {
            if (data.extensions) {
                mainFileTypes.push({
                    name,
                    ext: data.extensions.shift(),
                });

                for (const ext of data.extensions) {
                    // Skip extensions with multiple dots (E.G. .rest.txt)
                    if (ext.lastIndexOf(".") > 0) {
                        continue;
                    }

                    const name = ext.substring(1).toUpperCase();
                    additionalFileTypes.push({
                        name,
                        ext,
                    });
                }
            }
        }

        // Remove duplicate extensions from additionalFileTypes
        additionalFileTypes = additionalFileTypes.reduce(
            (newArray, currentType) => {
                const found =
                    mainFileTypes.find(type => type.ext === currentType.ext) ||
                    newArray.find(type => type.ext === currentType.ext);

                if (!found) {
                    newArray.push(currentType);
                }

                return newArray;
            },
            []
        );

        mainFileTypes.sort(sortTypes);
        additionalFileTypes.sort(sortTypes);
    }

    function sortTypes(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }

    /**
     * Add the given file type to the recent array
     * @param {object} typeToAdd
     */
    function addTypeToRecents(typeToAdd) {
        if (!recentFileTypes.length || recentFileTypes[0].ext !== typeToAdd.ext) {
            recentFileTypes = recentFileTypes.filter(type => {
                return type.ext !== typeToAdd.ext;
            });

            recentFileTypes.unshift(typeToAdd);
            context.globalState.update(RECENT_FILE_TYPES_STATE, recentFileTypes);
            isFileTypesDirty = true;
        }
    }

    function addFileTypeOptionsToSection(sectionTitle, typeToAdd) {
        fileTypesOptions.push({
            label: sectionTitle,
            kind: vscode.QuickPickItemKind.Separator
        });

        for (const type of typeToAdd) {
            fileTypesOptions.push({ label: `${type.name} (${type.ext})`, type });
        }
    }

    function filterOutRecents(items) {
        return items.filter(item => !recentFileTypes.find(recent => recent.ext === item.ext));
    }

    /**
     * Select the type of the scratchpad file
     */
    function selectFileType() {
        if (!fileTypesOptions || isFileTypesDirty) {
            fileTypesOptions = [];

            addFileTypeOptionsToSection("Recent", recentFileTypes);
            addFileTypeOptionsToSection("File types", [
                ...filterOutRecents(mainFileTypes),
                ...filterOutRecents(additionalFileTypes),
            ]);

            isFileTypesDirty = false;
        }

        window.showQuickPick(fileTypesOptions).then((selection) => {
            if (!selection) {
                return;
            }

            addTypeToRecents(selection.type);
            createScratchpad(selection.type.ext);
        });
    }

    /**
     * Get the user's input.
     * @param {string} placeholder Placeholder text for the input box
     */
    function getUserInput(placeholder) {
        // Wrap Thenable with a Promise for ease of use
        return new Promise((resolve, reject) => {
            window.showInputBox({ placeHolder: placeholder })
                .then((val) => {
                    resolve(val);
                }, (err) => {
                    reject(err);
                })
        })
    }

    /**
     * Create a new scratchpad file
     * If file name exists increment counter until a new file can be created
     *
     * @param {string} ext The file extension
     */
    function createScratchpad(ext) {
        let i = undefined;

        getUserInput("Enter a filename:").then(fileNameFromUser => {
            if (!fileNameFromUser) {
                fileNameFromUser = FILE_NAME_TEMPLATE;
            }

            let filename = `${fileNameFromUser}${ext}`;
            let fullPath = path.join(projectScratchpadsPath, filename);

            // Find an available filename
            while (fs.existsSync(fullPath)) {
                i = i ? i + 1 : 1;
                filename = `${fileNameFromUser}${i}${ext}`;
                fullPath = path.join(projectScratchpadsPath, filename);
            }

            fs.writeFileSync(fullPath, "");

            vscode.workspace.openTextDocument(fullPath).then(doc => {
                window.showTextDocument(doc);
            });
        });
    }

    /**
     * Remove all scratchpad files (usually when closing VS Code)
     * TODO: Need to fix the error messages due to open tabs of deleted files
     */
    function removeAllScratchpads() {
        promptForRemoval()
            .then(() => {
                return closeTabs();
            })
            .then(() => {
                deleteScratchpadFiles();
            })
            .catch(err => {
                console.log(err);
            });
    }

    function removeScratchpad() {
        let files = fs.readdirSync(projectScratchpadsPath);

        if (!files.length) {
            window.showInformationMessage("No scratchpads to delete");
            return;
        }

        window.showQuickPick(files).then((selection) => {
            if (!selection) {
                return;
            }

            let filePath = path.join(projectScratchpadsPath, selection);
            fs.unlinkSync(filePath);

            return selection;
        }).then(selection => {
            window.showInformationMessage(`Removed ${selection}`);
        });
    }

    /**
     * Prompt the user for confirmation before removing scratchpads
     */
    function promptForRemoval() {
        return new Promise((resolve, reject) => {
            let isPromptForRemoval = configuration.inspect(PROMPT_FOR_REMOVAL).globalValue;
            if (isPromptForRemoval === undefined || isPromptForRemoval) {
                window.showWarningMessage("Are you sure you want to remove all scratchpads?", { modal: true }, "Yes", "Always")
                    .then(item => {
                        switch (item) {
                            case "Yes":
                                resolve();
                                break;
                            case "Always":
                                configuration.update(PROMPT_FOR_REMOVAL, false, true);
                                resolve();
                                break;
                        }
                    }, err => {
                        reject(err);
                    });
            } else {
                resolve();
            }
        });
    }

    /**
     * Close all open tabs which edit a scratchpad document.
     * Use a "hack" which uses workbench actions (closeActiveEditor and nextEditor)
     * since there is no access to open tabs.
     */
    async function closeTabs() {
        let initial = window.activeTextEditor;
        let curr = {};

        while (initial && isScratchpadEditor(initial)) {
            // Started with a scratchpad tab
            // Close tab until it is not longer a scratchpad tab
            console.log("initial is a scratchpad: " + initial.document.fileName);

            await closeActiveEditor();
            initial = window.activeTextEditor;
        }

        if (initial) {
            console.log("initial editor: " + initial.document.fileName);

            while (initial.id !== curr.id) {
                // Iterate over open tabs and close scratchpad tabs until we're back to the initial tab
                if (isScratchpadEditor(window.activeTextEditor)) {
                    await closeActiveEditor();
                }

                await nextEditor();

                curr = window.activeTextEditor;
            }

            console.log("Back to initial tab. Stopping operation...");
        } else {
            console.log("No open tabs");
        }
    }

    /**
     * Close the current active tab
     */
    function closeActiveEditor() {
        return new Promise(resolve => {
            commands.executeCommand('workbench.action.closeActiveEditor');

            setTimeout(() => {
                resolve();
            }, ACTIONS_TIMEOUT);
        });
    }

    /**
     * Move to the next tab
     */
    function nextEditor() {
        return new Promise(resolve => {
            commands.executeCommand('workbench.action.nextEditor');

            setTimeout(() => {
                console.log("Active tab: " + window.activeTextEditor.document.fileName);

                resolve();
            }, ACTIONS_TIMEOUT);
        });
    }

    /**
     * Delete the scratchpad files from the project's scratchpads folder.
     */
    function deleteScratchpadFiles() {
        console.log("Deleting scratchpad files");

        let files = fs.readdirSync(projectScratchpadsPath);

        for (var i = 0, len = files.length; i < len; i++) {
            fs.unlinkSync(path.join(projectScratchpadsPath, files[i]));
        }

        window.showInformationMessage("Removed all scratchpads");
    }

    /**
     * Remove the project's scratchpads folder in case it's empty when deactivating the extension
     */
    function removeProjectFolderIfEmpty() {
        let files = fs.readdirSync(projectScratchpadsPath);

        if (!files.length) {
            fs.rmdirSync(projectScratchpadsPath);
        }
    }

    /**
     * Re-open a scratchpad file
     */
    function openScratchpad() {
        let files = fs.readdirSync(projectScratchpadsPath);

        if (!files.length) {
            window.showInformationMessage("No scratchpads to open");
            return;
        }

        window.showQuickPick(files).then((selection) => {
            if (!selection) {
                return;
            }

            let filePath = path.join(projectScratchpadsPath, selection);

            if (fs.existsSync(filePath)) {
                vscode.workspace.openTextDocument(filePath).then(function (TextDocument) {
                    vscode.window.showTextDocument(TextDocument, vscode.ViewColumn.One, false);
                });
            }
        });
    }
})();