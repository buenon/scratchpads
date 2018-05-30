// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const window = vscode.window;

exports.activate = activate;
exports.deactivate = deactivate;

"use strict";
const FILE_NAME_TEMPLATE = "scratch";
const FILE_TYPES_DB = "typesConfig.json";
const FILE_TYPES_INITIAL_DB = "typesInitialConfig.json";
let basePath;
let fileTypes;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    init(context);

    let disposable = vscode.commands.registerCommand('extension.openTypedScratch', selectType);
    context.subscriptions.push(disposable);
}

/**
 * Initialization
 * @param {Object} context The extension object
 */
function init(context) {
    basePath = context.extensionPath;
    loadFileTypes();
}

/**
 * Save state and free up resources
 */
function deactivate() {
    saveFileTypes();
    removeScratches();
}

/**
 * Load the latest order of file types
 */
function loadFileTypes() {
    let fullPath = path.join(basePath, FILE_TYPES_DB);

    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(basePath, FILE_TYPES_INITIAL_DB);
    }

    fileTypes = JSON.parse(fs.readFileSync(fullPath));
}

/**
 * Save the latest order of file types
 */
function saveFileTypes() {
    let fullPath = path.join(basePath, FILE_TYPES_DB);

    fs.writeFileSync(fullPath, JSON.stringify(fileTypes));
}

/**
 * Create a new scratch file
 * If file name exists increment counter untill a new file can be created
 * 
 * @param {Object} type The file type object
 */
function createScratch(type) {
    let i = undefined;
    let ext = type.ext;
    let filename = FILE_NAME_TEMPLATE + "." + ext;
    let fullPath = path.join(basePath, filename);

    while (fs.existsSync(fullPath)) {
        i = i ? i + 1 : 1;
        filename = FILE_NAME_TEMPLATE + i + "." + ext;
        fullPath = path.join(basePath, filename);
    }

    fs.writeFileSync(fullPath, "");

    vscode.workspace.openTextDocument(fullPath).then(doc => {
        window.showTextDocument(doc);
    });
}

/**
 * Select the type of the scratch file 
 */
function selectType() {
    var items = [];

    for (const i in fileTypes) {
        items.push({ label: fileTypes[i].lang, index: i });
    }

    window.showQuickPick(items).then((selection) => {
        if (!selection) {
            return;
        }

        reorderFileTypes(selection.index);
        createScratch(fileTypes[0]);
    });
}

/**
 * Move the element at the given index to the top of the array
 * in order to keep the last selection
 * @param {number} index The index of the element to move
 */
function reorderFileTypes(index) {
    fileTypes.splice(0, 0, fileTypes.splice(index, 1)[0]);
}

/**
 * Remove all scratch files (usually when closing VS Code)
 */
function removeScratches() {
    fs.readdir(basePath, (err, files) => {
        for (var i = 0, len = files.length; i < len; i++) {
            var match = files[i].match(FILE_NAME_TEMPLATE + ".*");
            if (match !== null)
                fs.unlink(path.join(basePath, match[0]));
        }
    });
}