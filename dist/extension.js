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
const fs = __webpack_require__(2);
const importsAnalyzed = new Set();
const importToAnalyze = [];
let finalCode = '';
async function processImports() {
    while (importToAnalyze.length > 0) {
        const importStatement = importToAnalyze.shift();
        if (!importStatement || importsAnalyzed.has(importStatement)) {
            continue;
        }
        importsAnalyzed.add(importStatement);
        if (importStatement.startsWith('github.com')) {
            const packageName = importStatement.substring(0, importStatement.lastIndexOf('/'));
            const packageFiles = getPackageFiles(packageName);
            for (const file of packageFiles) {
                const fileCode = fs.readFileSync(file, 'utf-8');
                const cleanedCode = cleanCode(fileCode);
                analyzeImports(cleanedCode);
                finalCode += cleanedCode;
            }
        }
    }
}
function getPackageFiles(packageName) {
    // Implement this function to return the list of files in the given package name
    // You can use the file system APIs or any other method to retrieve the list of files
    // and return them as an array of file paths.
    return [];
}
function analyzeImports(code) {
    const regex = /import \(([\s\S]*?)\)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        const imports = match[1].split('\n').filter((imp) => imp.trim().length > 0);
        for (const imp of imports) {
            const importStatement = imp.split(' ')[0].replace(/[()\s"]/g, '');
            importToAnalyze.push(importStatement);
        }
    }
}
function cleanCode(code) {
    // Clean non-standard library imports
    const nonStdLibImports = Array.from(importsAnalyzed).filter((imp) => imp.startsWith('github.com'));
    for (const imp of nonStdLibImports) {
        const importAlias = imp.split(' ')[1].replace(/[()\s"]/g, '');
        const importPackage = imp.split(' ')[0].replace(/[()\s"]/g, '');
        const regex = new RegExp(`${importAlias}\\.(\\w+)`, 'g');
        code = code.replace(regex, '$1');
    }
    // Remove package header and import blocks from code
    // Replace the aliases with the dot (.) in every occurrence in the code
    // Remove package header
    code = code.replace(/^package\s+\w+\s*/, '');
    // Remove import blocks
    code = code.replace(/^import\s+\(([\s\S]*?)\)/gm, '');
    return code;
}
async function aggregate() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const fileName = activeEditor.document.fileName;
        const folderPath = fileName.substring(0, fileName.lastIndexOf('/'));
        const mainCode = fs.readFileSync(fileName, 'utf-8');
        finalCode = '';
        // Clean the main code and add it to the final code
        const cleanedMainCode = cleanCode(mainCode);
        analyzeImports(cleanedMainCode);
        finalCode += cleanedMainCode;
        // Analyze the imports in the main code
        analyzeImports(cleanedMainCode);
        // Process the imports and generate the final code
        await processImports();
        // Append the original main code as a comment
        finalCode = `// Original main.go:\n// ${mainCode}\n\n` + finalCode;
        // Generate the package header and import statements
        const packageHeader = 'package main\n\n';
        const importStatements = Array.from(importsAnalyzed).join('\n');
        // Generate the final content
        const finalContent = packageHeader + importStatements + '\n\n' + finalCode;
        // Write the final code to output.go in the same folder
        const outputPath = folderPath + '/output.go';
        fs.writeFileSync(outputPath, finalContent);
        vscode.window.showInformationMessage(`Generated output.go at ${outputPath}`);
    }
    return;
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