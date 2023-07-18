/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var deselectCurrent = __webpack_require__(5);

var clipboardToIE11Formatting = {
  "text/plain": "Text",
  "text/html": "Url",
  "default": "Text"
}

var defaultMessage = "Copy to clipboard: #{key}, Enter";

function format(message) {
  var copyKey = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

function copy(text, options) {
  var debug,
    message,
    reselectPrevious,
    range,
    selection,
    mark,
    success = false;
  if (!options) {
    options = {};
  }
  debug = options.debug || false;
  try {
    reselectPrevious = deselectCurrent();

    range = document.createRange();
    selection = document.getSelection();

    mark = document.createElement("span");
    mark.textContent = text;
    // avoid screen readers from reading out loud the text
    mark.ariaHidden = "true"
    // reset user styles for span element
    mark.style.all = "unset";
    // prevents scrolling to the end of the page
    mark.style.position = "fixed";
    mark.style.top = 0;
    mark.style.clip = "rect(0, 0, 0, 0)";
    // used to preserve spaces and line breaks
    mark.style.whiteSpace = "pre";
    // do not inherit user-select (it may be `none`)
    mark.style.webkitUserSelect = "text";
    mark.style.MozUserSelect = "text";
    mark.style.msUserSelect = "text";
    mark.style.userSelect = "text";
    mark.addEventListener("copy", function(e) {
      e.stopPropagation();
      if (options.format) {
        e.preventDefault();
        if (typeof e.clipboardData === "undefined") { // IE 11
          debug && console.warn("unable to use e.clipboardData");
          debug && console.warn("trying IE specific stuff");
          window.clipboardData.clearData();
          var format = clipboardToIE11Formatting[options.format] || clipboardToIE11Formatting["default"]
          window.clipboardData.setData(format, text);
        } else { // all other browsers
          e.clipboardData.clearData();
          e.clipboardData.setData(options.format, text);
        }
      }
      if (options.onCopy) {
        e.preventDefault();
        options.onCopy(e.clipboardData);
      }
    });

    document.body.appendChild(mark);

    range.selectNodeContents(mark);
    selection.addRange(range);

    var successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("copy command was unsuccessful");
    }
    success = true;
  } catch (err) {
    debug && console.error("unable to copy using execCommand: ", err);
    debug && console.warn("trying IE specific stuff");
    try {
      window.clipboardData.setData(options.format || "text", text);
      options.onCopy && options.onCopy(window.clipboardData);
      success = true;
    } catch (err) {
      debug && console.error("unable to copy using clipboardData: ", err);
      debug && console.error("falling back to prompt");
      message = format("message" in options ? options.message : defaultMessage);
      window.prompt(message, text);
    }
  } finally {
    if (selection) {
      if (typeof selection.removeRange == "function") {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark) {
      document.body.removeChild(mark);
    }
    reselectPrevious();
  }

  return success;
}

module.exports = copy;


/***/ }),
/* 5 */
/***/ ((module) => {


module.exports = function () {
  var selection = document.getSelection();
  if (!selection.rangeCount) {
    return function () {};
  }
  var active = document.activeElement;

  var ranges = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
    case 'INPUT':
    case 'TEXTAREA':
      active.blur();
      break;

    default:
      active = null;
      break;
  }

  selection.removeAllRanges();
  return function () {
    selection.type === 'Caret' &&
    selection.removeAllRanges();

    if (!selection.rangeCount) {
      ranges.forEach(function(range) {
        selection.addRange(range);
      });
    }

    active &&
    active.focus();
  };
};


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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(2);
const fs = __webpack_require__(3);
const copy = __webpack_require__(4);
const importsAnalyzed = new Set(); // contains only non std libraries
const importToAnalyze = []; // contains only non std libraries
let finalImports = new Set();
let finalCode = '';
// it preserve line indexes, it will remove also fake comments like the ones in strings, but for out goal, avoiding this isn't necessary
function removeCommentsAndFixForReadImportBlock(s) {
    let m = s.match(/\/\*.*?\*\//gs);
    while (m !== null) {
        console.log(m);
        var c = m[0].match(/\n/gs)?.length;
        var caporighe = "";
        for (var i = 0; i < c; i++) {
            caporighe = caporighe + '\n';
        }
        s = s.replace(/\/\*.*?\*\//s, caporighe);
        m = s.match(/\/\*.*?\*\//gs);
    }
    s = s.replaceAll(/\/\/.*?\n/, '\n');
    return s;
}
function getPackagesAndAlias(importBlock) {
    importBlock = importBlock.replaceAll("import", '\n');
    importBlock = importBlock.replaceAll("(", '\n');
    importBlock = importBlock.replaceAll(")", '\n');
    importBlock = importBlock.replaceAll(";", '\n');
    // remove empty lines
    importBlock = importBlock.replace(/(^[ \t]*\n)/gm, "");
    // Lists to store aliases and packages
    const aliases = [];
    const packages = [];
    let match = importBlock.split('\n');
    for (let i = 0; i < match.length; i++) {
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
            code = code.replace(RegExp('(?<![a-zA-Z0-9])' + searchString, "g"), '');
        }
    }
    return code;
}
function processFile(filePath) {
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
            isInImportBlock = true;
            importBlock += line + '\n';
        }
        else if (isInImportBlock) {
            if (line === ')') {
                isInImportBlock = false;
            }
            importBlock += line + '\n';
        }
        else if (line != "") {
            lines = fileContent.split('\n');
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
        if (pkg.split('/')[0] == 'github.com') {
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
    const cleanedCode = cleanAlias(aliasesToRemove, code);
    // Append the cleaned code to finalCode
    finalCode += cleanedCode;
}
function aggregate() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const rootPath = workspaceFolder.uri.fsPath;
        const mainGoPath = path.join(rootPath, 'main.go');
        const solutionGoPath = path.join(rootPath, 'solution.go');
        importsAnalyzed.clear();
        importToAnalyze.length = 0;
        finalCode = '';
        finalImports = new Set();
        processFile(mainGoPath);
        processFile(solutionGoPath);
        // Process importToAnalyze queue
        while (importToAnalyze.length > 0) {
            const importPath = importToAnalyze.shift();
            if (importPath) {
                const packagePath = path.join('/', importPath);
                const files = fs.readdirSync(packagePath);
                for (const file of files) {
                    if (file.endsWith(".go")) {
                        const filePath = path.join(packagePath, file);
                        processFile(filePath);
                    }
                }
            }
        }
        // Create the output file
        const originalSolutionGo = fs.readFileSync(solutionGoPath, 'utf-8');
        const outputContent = `// Generated with https://github.com/lorenzotinfena/go-aggregator
// Original source code:
/*
${originalSolutionGo}
*/
package main
import (\n${Array.from(finalImports).join('\n')}
)
${finalCode}`;
        copy(outputContent);
        vscode.window.showInformationMessage('Aggregated!');
    }
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('go-aggregator.aggregate', () => {
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