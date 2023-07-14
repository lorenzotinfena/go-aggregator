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
const importsAnalyzed = new Set(); // contains only non std libraries
const importToAnalyze = []; // contains only non std libraries
let finalImports = new Set();
let finalCode = '';
function getPackagesAndAlias(importBlock) {
    // Regex pattern to parse individual imports
    const importLinePattern = /(?:[^"'\r\n]+)?["'][^"']*["']/g;
    // Lists to store aliases and packages
    const aliases = [];
    const packages = [];
    let match;
    while ((match = importLinePattern.exec(importBlock))) {
        var importLine = match[0].replace(/"/g, ' ').trim().replace(/\s+/g, " ");
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
            const searchString = aliases[i] + '.';
            while (code.includes(searchString)) {
                code = code.replace(code, searchString);
            }
        }
    }
    return code;
}
function processFile(filePath) {
    // read filePath and remove comments
    const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\/\/.*?\n/g, '').replace(/\/\*.*?\*\//gs, '');
    const lines = fileContent.split('\n');
    let packageHeader = '';
    let importBlock = '';
    let code = '';
    // Extract package header, import block, and code
    let isInImportBlock = false;
    for (const line of lines) {
        if (line.startsWith('package')) {
            packageHeader = line;
        }
        else if (line.startsWith('import')) {
            isInImportBlock = true;
            importBlock += line + '\n';
        }
        else if (isInImportBlock) {
            if (line.trim() === ')') {
                isInImportBlock = false;
            }
            importBlock += line + '\n';
        }
        else {
            code += line + '\n';
        }
    }
    var result = getPackagesAndAlias(importBlock);
    // Clean the code by removing aliases
    const cleanedCode = cleanAlias(result.aliases, code);
    // Append the cleaned code to finalCode
    finalCode += cleanedCode;
    // Analyze the imports
    for (let i = 0; i < result.packages.length; i++) {
        const pkg = result.packages[i];
        if (pkg.split('/')[0] == 'github.com') {
            if (!importsAnalyzed.has(pkg)) {
                importsAnalyzed.add(pkg);
                importToAnalyze.push(pkg);
            }
        }
        else {
            finalImports.add(result.aliases[i] + " \"" + pkg + '"');
        }
    }
}
function aggregate() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const rootPath = workspaceFolder.uri.fsPath;
        const mainGoPath = path.join(rootPath, 'main.go');
        const outputPath = path.join(rootPath, 'output.go');
        // Check if main.go exists
        if (!fs.existsSync(mainGoPath)) {
            vscode.window.showErrorMessage('main.go file not found.');
            return;
        }
        importsAnalyzed.clear();
        importToAnalyze.length = 0;
        finalCode = '';
        processFile(mainGoPath);
        // Process importToAnalyze queue
        while (importToAnalyze.length > 0) {
            const importPath = importToAnalyze.shift();
            if (importPath) {
                const packagePath = path.join('/', importPath);
                const files = fs.readdirSync(packagePath);
                for (const file of files) {
                    const filePath = path.join(packagePath, file);
                    processFile(filePath);
                }
            }
        }
        // Create the output file
        const originalMainGo = fs.readFileSync(mainGoPath, 'utf-8');
        const outputContent = `// Original main.go:\n/*\n ${originalMainGo}\n*/\n\n\n\n\npackage main\nimport (\n${Array.from(finalImports).join('\n')}\n)\n${finalCode}`;
        fs.writeFileSync(outputPath, outputContent);
        vscode.window.showInformationMessage('Aggregation completed successfully.');
    }
}
function activate(context) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');
    const disposable = vscode.commands.registerCommand('go-aggregator.helloWorld', () => {
        aggregate();
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map