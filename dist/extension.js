/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("process");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(2);
const fs = __webpack_require__(3);
const process_1 = __webpack_require__(4);
const importsAnalyzed = new Set(); // contains only non std libraries
const importToAnalyze = []; // contains only non std libraries
let finalImports = new Set();
let finalCode = '';
// it preserve line indexes, it will remove also fake comments like the ones in strings, but for out goal, avoiding this isn't necessary
function removeCommentsAndFixForReadImportBlock(s) {
    let m = s.match(/\/\*.*?\*\//s);
    while (m !== null) {
        console.log(m);
        var c = m[0].match(/\n/gs)?.length;
        var caporighe = "";
        for (var i = 0; i < c; i++) {
            caporighe = caporighe + '\n';
        }
        s = s.replace(/\/\*.*?\*\//s, caporighe);
        m = s.match(/\/\*.*?\*\//s);
    }
    s = s.replaceAll(/\/\/.*?\n/gs, '\n');
    return s;
}
function getPackagesAndAlias(importBlock) {
    importBlock = importBlock.replaceAll(/import/g, '\n');
    importBlock = importBlock.replaceAll(/\(/g, '\n');
    importBlock = importBlock.replaceAll(/\)/g, '\n');
    importBlock = importBlock.replaceAll(/;/g, '\n');
    // remove empty lines
    importBlock = importBlock.replaceAll(/^\s*[\r\n]/gm, "");
    // Lists to store aliases and packages
    const aliases = [];
    const packages = [];
    let match = importBlock.split('\n');
    for (let i = 0; i < match.length; i++) {
        if (match[i] == "") {
            continue;
        }
        var importLine = match[i].replaceAll(/"/g, ' ').trim().replaceAll(/\t/g, " ").replaceAll(/\s+/g, " ");
        var existAlias = true;
        if (importLine.charAt(0) === '.' || importLine.charAt(0) === '_') {
            importLine = importLine.substring(1);
            existAlias = false;
        }
        importLine = importLine.trim();
        var splitted = importLine.split(' ');
        var pack = splitted[splitted.length - 1];
        packages.push(pack);
        if (existAlias) {
            var tmp = splitted[0].split('/');
            var alias = tmp[tmp.length - 1];
            aliases.push(alias);
        }
        else {
            aliases.push(importLine.charAt(0));
        }
    }
    return { aliases, packages };
}
function cleanAlias(aliases, code) {
    for (let i = 0; i < aliases.length; i++) {
        if (aliases[i][0] !== '.' && aliases[i][0] !== '_') {
            code = code.replace(RegExp('(?<![a-zA-Z0-9])' + aliases[i] + '\.', "g"), '');
        }
    }
    return code;
}
function processFile(filePath, importPath, website) {
    // read filePath and remove comments
    const fileContent = fs.readFileSync(filePath, 'utf-8') + '\n';
    const fileContentWithoutComments = removeCommentsAndFixForReadImportBlock(fileContent);
    var lines = fileContentWithoutComments.split('\n');
    let importBlock = '';
    let code = '';
    // Extract package header, import block, and code
    let isInImportBlock = false;
    for (let i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('package')) {
        }
        else if (line.startsWith('import')) {
            if (!line.startsWith('import "')) {
                isInImportBlock = true;
            }
            importBlock += line + '\n';
        }
        else if (isInImportBlock) {
            if (line === ')') {
                isInImportBlock = false;
            }
            importBlock += line + '\n';
        }
        else if (line != "") {
            // add header as comments
            code += '//--------------------------------------------------------------------------\n';
            code += '// File from package: ' + importPath + '\n//\n';
            lines = fileContent.split('\n');
            for (let j = 0; j < i; j++) {
                line = lines[j];
                code += '// ' + line + '\n';
            }
            for (; i < lines.length; i++) {
                line = lines[i];
                code += line + '\n';
            }
            break;
        }
    }
    var result = getPackagesAndAlias(importBlock);
    var aliasesToRemove = [];
    // Analyze the imports
    for (let i = 0; i < result.packages.length; i++) {
        const pkg = result.packages[i];
        if (pkg.split('/')[0].includes('.')) {
            aliasesToRemove.push(result.aliases[i]);
            if (!importsAnalyzed.has(pkg)) {
                importsAnalyzed.add(pkg);
                importToAnalyze.push(pkg);
            }
        }
        else {
            finalImports.add(result.aliases[i] + " \"" + pkg + '"');
        }
    }
    // Clean the code by removing aliases
    var cleanedCode = cleanAlias(aliasesToRemove, code);
    if (importPath == "main" && website == "leetcode") {
        cleanedCode = cleanedCode.replace("func main(", "func _main(");
    }
    // Append the cleaned code to finalCode
    finalCode += cleanedCode;
}
// path can't begin with '/'
// Fix the validity of a relative path, for each folder in the parameter (exept for the first) can be:
//  - a valid folder name
//  - a prefix of a folder namer which is followed by a '@' and then arbitrary symbols
function fixPath(path) {
    const folders = path.split('/').filter(Boolean);
    let fixeddPath = '/' + folders[0] + '/';
    for (let i = 1; i < folders.length; i++) {
        const updatedFolder = fs.readdirSync(fixeddPath, { withFileTypes: true })
            .sort((a, b) => b.name.localeCompare(a.name)) // this prevent taking older versions
            .find((entry) => entry.isDirectory() && entry.name.startsWith(folders[i] + '@'));
        if (updatedFolder) {
            fixeddPath += updatedFolder.name + '/';
        }
        else {
            fixeddPath += folders[i] + '/';
        }
    }
    return fixeddPath;
}
function aggregate(website) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const rootPath = workspaceFolder.uri.fsPath;
        const utilsGoPath = path.join(rootPath, 'utils.go');
        const solutionGoPath = path.join(rootPath, 'solution.go');
        var notdebugGoPath = path.join(rootPath, 'notdebug.go');
        importsAnalyzed.clear();
        importToAnalyze.length = 0;
        finalCode = '';
        finalImports = new Set();
        processFile(utilsGoPath, 'main', website);
        processFile(solutionGoPath, 'main', website);
        processFile(notdebugGoPath, 'main', website);
        // Process importToAnalyze queue
        while (importToAnalyze.length > 0) {
            const importPath = importToAnalyze.shift();
            if (importPath && !importPath.startsWith("github.com/lorenzotinfena/goji/")) {
                (0, process_1.exit)(1);
            }
            if (importPath && importPath.startsWith("github.com/lorenzotinfena/goji/")) {
                const packagePath = fixPath(path.join('/go/pkg/mod', importPath));
                const files = fs.readdirSync(packagePath);
                for (const file of files) {
                    if (file.endsWith(".go") && !file.endsWith("_test.go")) {
                        const filePath = path.join(packagePath, file);
                        processFile(filePath, importPath, website);
                    }
                }
            }
        }
        // Create the output file
        const originalSolutionGo = fs.readFileSync(solutionGoPath, 'utf-8');
        var packagemain = "package main";
        if (website == "leetcode") {
            packagemain = "//package main";
        }
        const outputContent = `// Template: https://github.com/lorenzotinfena/competitive-go
// Generated with: https://github.com/lorenzotinfena/go-aggregator
// Original code:
/*
${originalSolutionGo}
*/
//--------------------------------------------------------------------------
//--------------------------------------------------------------------------
// Generated code:
${packagemain}
import (
${Array.from(finalImports).join('\n')}
)
${finalCode}`;
        vscode.env.clipboard.writeText(outputContent);
        vscode.window.showInformationMessage('Done!');
    }
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('go-aggregator.aggregate-and-copy-codeforces', () => {
        vscode.env.clipboard.writeText("error");
        vscode.env.clipboard.writeText("😀");
        aggregate("codeforces");
    });
    const disposable2 = vscode.commands.registerCommand('go-aggregator.aggregate-and-copy-leetcode', () => {
        vscode.env.clipboard.writeText("error");
        vscode.env.clipboard.writeText("😀");
        aggregate("leetcode");
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map