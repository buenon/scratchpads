// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

exports.activate = activate;
exports.deactivate = deactivate;

"use strict";
const fileName = "scratch";
let basePath;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    init(context);

    let disposable = vscode.commands.registerCommand('extension.openTypedScratch', createScratch);
    context.subscriptions.push(disposable);
}

function init(context) {
    basePath = context.extensionPath;
}

function deactivate() {
    removeScratches();
}

function createScratch() {
    let i = undefined;
    let initialFilename = path.join(basePath, fileName);
    let fullPath = initialFilename;

    while (fs.existsSync(fullPath)) {
        i = i ? i + 1 : 1;
        fullPath = initialFilename + i;
    }

    fs.writeFileSync(fullPath, "");

    vscode.workspace.openTextDocument(fullPath).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}

function removeScratches() {
    fs.readdir(basePath, (err, files) => {
        for (var i = 0, len = files.length; i < len; i++) {
            var match = files[i].match(fileName + ".*");
            if (match !== null)
                fs.unlink(path.join(basePath, match[0]));
        }
    });
}