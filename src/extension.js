(() => {
    exports.activate = activate;
    exports.deactivate = deactivate;

    // Exports for file types functions
    exports.addNewFileType = addNewFileType;
    exports.removeFileType = removeFileType;
    exports.restoreDefaultFileTypes = restoreDefaultFileTypes;

    // The module 'vscode' contains the VS Code extensibility API
    // Import the module and reference it with the alias vscode in your code below
    const fs = require('fs');
    const path = require('path');
    const vscode = require('vscode');
    const window = vscode.window;
    const commands = vscode.commands;
    const md5 = require('md5');

    "use strict";
    const SCRATCHPADS_FOLDER = "scratchpads";
    const FILE_NAME_TEMPLATE = "scratch";
    const FILE_TYPES_DB = "typesConfig.json";
    const FILE_TYPES_STATE = "fileTypesState";
    const ACTIONS_TIMEOUT = 500; // Need to pause a bit when changing or closing the active tab 
    const PROMPT_FOR_REMOVAL = "promptForRemoval";

    let context;
    let configuration;
    let scratchpadsPath;
    let projectScratchpadsPath;
    let fileTypesDB;
    let fileTypes;
    let scratchpadPathRegex;

    let app = this;

    // this method is called when your extension is activated
    // your extension is activated the very first time the command is executed
    function activate(ctx) {
        context = ctx;
        init();

        let createCommand = commands.registerCommand('scratchpads.newScratchpad', selectFileType);
        context.subscriptions.push(createCommand);

        let removeCommand = commands.registerCommand('scratchpads.removeScratchpads', removeScratchpads);
        context.subscriptions.push(removeCommand);

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
        fileTypesDB = path.join(context.extensionPath, FILE_TYPES_DB);
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
     * Load the file types DB
     */
    function loadFileTypes(isReload = false) {
        if (isReload) {
            fileTypes = undefined;
        }
        else {
            fileTypes = context.globalState.get(FILE_TYPES_STATE);
        }

        let defaultFileTypes = JSON.parse(fs.readFileSync(fileTypesDB));

        if (fileTypes) {
            // In case of upgrade, keep previous types and add new types added to the new version
            defaultFileTypes.forEach(fileType => {
                if (fileType.ext) {
                    let found = fileTypes.find((item) => {
                        return fileType.ext === item.ext;
                    });

                    if (!found) {
                        // Add the item before all popup's custom commands
                        fileTypes.splice(fileTypes.length - 4, 0, fileType);
                    }
                }
            });
        }
        else {
            fileTypes = defaultFileTypes;
        }

        saveFileTypes();
    }

    /**
     * Save the file types DB
     */
    function saveFileTypes() {
        context.globalState.update(FILE_TYPES_STATE, fileTypes);
    }

    /**
     * Move the element at the given index to the top of the array
     * in order to keep the last selection at the top of the list
     * @param {number} index The index of the element to move
     */
    function reorderFileTypes(index) {
        if (index !== 0) {
            fileTypes.splice(0, 0, fileTypes.splice(index, 1)[0]);
            saveFileTypes();
        }
    }

    /**
     * Select the type of the scratchpad file 
     */
    function selectFileType() {
        let items = [];

        fileTypes.map((item, i) => {
            items.push({ label: item.type, index: i });
        });

        window.showQuickPick(items).then((selection) => {
            if (!selection) {
                return;
            }

            let type = fileTypes[selection.index];

            if (type.func) {
                app[type.func]();
            }
            else if (type.ext) {
                reorderFileTypes(selection.index);
                createScratchpad(fileTypes[0]);
            }
        });
    }

    /**
     * Add a new file type to the DB
     * Validation will fail if the file type's name or extension already exists
     */
    function addNewFileType() {
        let type, ext;

        getUserInput("Enter file type name:")
            .then(val => {
                type = val;
                return validate("type", type);
            })
            .then(() => {
                return getUserInput("Enter file extension:");
            })
            .then(val => {
                ext = val;
                return validate("ext", ext);
            })
            .then(() => {
                fileTypes.unshift({ type: type, ext: ext });
                saveFileTypes();
                createScratchpad(fileTypes[0]);
            })
            .catch(err => {
                window.showErrorMessage(err.message);
            });
        ;
    }

    /**
     * Remove file types from the list
     */
    function removeFileType() {
        let items = [];

        fileTypes.map((item, i) => {
            if (item.ext) {
                items.push({ label: item.type, index: i });
            }
        });

        window.showQuickPick(items, { canPickMany: true }).then((selection) => {
            if (!selection || !selection.length) {
                return;
            }

            selection.sort((a, b) => {
                return b.index - a.index;
            });

            let labels = selection.map((item) => {
                fileTypes.splice(item.index, 1);
                return item.label;
            });

            window.showInformationMessage(`Removed  file type${labels.length > 1 ? "s" : ""}: '${labels.join("', '")}'`);

            saveFileTypes();
        });
    }

    /**
     * Restore the default list of file types
     */
    function restoreDefaultFileTypes() {
        window.showWarningMessage("Are you sure you want to restore default file types?", { modal: true }, "Yes")
            .then(answer => {
                if (answer) {
                    loadFileTypes(true);
                }
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
     * Validate that the file type or extension do not exist in the DB
     * @param {string} key Either "type" or "ext"
     * @param {string} val The value to validate
     */
    function validate(key, val) {
        return new Promise((resolve) => {
            if (!val) {
                return;
            }

            let msg;
            let found = fileTypes.some(item => {
                if (item[key] && item[key].toLowerCase() === val.toLowerCase()) {
                    msg = `File type already exist {type: ${item.type}, ext: ${item.ext}}`;
                    return true;
                }

                return false;
            });

            if (found) {
                throw new Error(msg);
            }
            else {
                resolve();
            }
        });
    }

    /**
     * Create a new scratchpad file
     * If file name exists increment counter until a new file can be created
     * 
     * @param {Object} type The file type object
     */
    function createScratchpad(type) {
        let i = undefined;
        let ext = type.ext;
        
        getUserInput("Enter a filename:").then(fileNameFromUser => {
            if (!fileNameFromUser) {
                fileNameFromUser = FILE_NAME_TEMPLATE;
            }
            
            let filename = `${fileNameFromUser}.${ext}`;
            let fullPath = path.join(projectScratchpadsPath, filename);

            // Find an available filename
            while (fs.existsSync(fullPath)) {
                i = i ? i + 1 : 1;
                filename = `${fileNameFromUser}${i}.${ext}`;
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
    function removeScratchpads() {
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
            }
            else {
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
        }
        else {
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
            fs.unlinkSync(path.join(projectScratchpadsPath, match[0]));
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

        if (files.length == 0) {
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