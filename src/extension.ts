import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const importsAnalyzed: Set<string> = new Set(); // contains only non std libraries
const importToAnalyze: string[] = []; // contains only non std libraries
let finalImports = new Set<string>();
let finalCode = '';


function getPackagesAndAlias(importBlock: string): { aliases: string[], packages: string[] } {
  // Regex pattern to parse individual imports
  const importLinePattern = /(?:[^"'\r\n]+)?["'][^"']*["']/g;

  // Lists to store aliases and packages
  const aliases: string[] = [];
  const packages: string[] = [];

  let match;
  while ((match = importLinePattern.exec(importBlock))) {
    var importLine = match[0].replace(/"/g, ' ').trim().replace(/\s+/g, " ");

var existAlias = true;
    if (importLine.charAt(0) === '.' || importLine.charAt(0) === '_' ) {
      importLine = importLine.substring(1);
      existAlias = false;
    }

    importLine=importLine.trim();
    var splitted = importLine.split(' ')
    var pack = splitted[splitted.length-1]

     packages.push(pack);
     if(existAlias ){

    var tmp = splitted[0].split('/')
    var alias = tmp[tmp.length-1]
    aliases.push(alias);
     } else {
      aliases.push(importLine.charAt(0));
     }
    
  }

  return { aliases, packages };
}


function cleanAlias(aliases: string[], code: string): string {
  for (let i = 0; i < aliases.length; i++) {
    if (aliases[i][0] !== '.' && aliases[i][0] !== '_' ) {
      const searchString = aliases[i]+'.';
      code = code.replace(RegExp('(?<![a-zA-Z0-9])'+searchString, "g"), '')
    }
  }
  return code;
}


function processFile(filePath: string) {
  // read filePath and remove comments
  const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\/\/.*?\n/g, '\n').replace(/\/\*.*?\*\//gs, '\n');
  const lines = fileContent.split('\n');
  let packageHeader = '';
  let importBlock = '';
  let code = '';

  // Extract package header, import block, and code
  let isInImportBlock = false;
  for (const line of lines) {
    if (line.startsWith('package')) {
      packageHeader = line;
    } else if (line.startsWith('import')) {
      isInImportBlock = true;
      importBlock += line + '\n';
    } else if (isInImportBlock) {
      if (line.trim() === ')') {
        isInImportBlock = false;
      }
      importBlock += line + '\n';
    } else {
      code += line + '\n';
    }
  }

  var result = getPackagesAndAlias(importBlock);


  var aliasesToRemove: string[] = [];

  // Analyze the imports
  for (let i = 0; i < result.packages.length; i++) {
    const pkg = result.packages[i]
    if (pkg.split('/')[0] == 'github.com') {
      aliasesToRemove.push(result.aliases[i])
      if (!importsAnalyzed.has(pkg)) {
        importsAnalyzed.add(pkg);
        importToAnalyze.push(pkg);
      }
    } else {
      finalImports.add(result.aliases[i] + " \"" + pkg +'"');
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
          if (file.endsWith(".go")) {
            const filePath = path.join(packagePath, file);
            processFile(filePath);
          }
        }
      }
    }

    // Create the output file
    const originalMainGo = fs.readFileSync(mainGoPath, 'utf-8');
    const outputContent = `// Generated with https://github.com/lorenzotinfena/go-aggregator\n// Original source code:\n/*\n ${originalMainGo}\n*/\n\n\n\n\npackage main\nimport (\n${Array.from(finalImports).join('\n')}\n)\n${finalCode}`;
    fs.writeFileSync(outputPath, outputContent);

    vscode.window.showInformationMessage('Aggregation completed successfully.');
  }
}
export function activate(context: vscode.ExtensionContext) {
  
	const disposable = vscode.commands.registerCommand('go-aggregator.aggregate', () => {
		aggregate();
	});

	context.subscriptions.push(disposable);
}