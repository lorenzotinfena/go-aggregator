import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as copy from 'copy-to-clipboard';

const importsAnalyzed: Set<string> = new Set(); // contains only non std libraries
const importToAnalyze: string[] = []; // contains only non std libraries
let finalImports = new Set<string>();
let finalCode = '';

// it preserve line indexes, it will remove also fake comments like the ones in strings, but for out goal, avoiding this isn't necessary
function removeCommentsAndFixForReadImportBlock(s: string): string {
  let m = s.match(/\/\*.*?\*\//gs)

while (m !== null) {
  console.log(m);
  var c = m[0].match(/\n/gs)?.length!
  var caporighe=""
  for(var i=0; i<c; i++) {
caporighe = caporighe+'\n'
  }
  s = s.replace(/\/\*.*?\*\//s, caporighe)

  m = s.match(/\/\*.*?\*\//gs)
}

s=s.replaceAll(/\/\/.*?\n/, '\n')
  return s
}

function getPackagesAndAlias(importBlock: string): { aliases: string[], packages: string[] } {
  importBlock = importBlock.replaceAll("import", '\n')
  importBlock = importBlock.replaceAll("(", '\n')
  importBlock = importBlock.replaceAll(")", '\n')
  importBlock = importBlock.replaceAll(";", '\n')

  // remove empty lines
  importBlock = importBlock.replace(/(^[ \t]*\n)/gm, "")

  // Lists to store aliases and packages
  const aliases: string[] = [];
  const packages: string[] = [];

  let match = importBlock.split('\n');
  for (let i = 0; i < match.length; i++) {
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
  const fileContent = fs.readFileSync(filePath, 'utf-8')+'\n';
  const fileContentWithoutComments = removeCommentsAndFixForReadImportBlock(fileContent)
  var lines = fileContentWithoutComments.split('\n')
  let importBlock = '';
  let code = '';

  // Extract package header, import block, and code
  let isInImportBlock = false;
  for (let i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (line.startsWith('package')) {
    } else if (line.startsWith('import')) {
      isInImportBlock = true;
      importBlock += line + '\n';
    } else if (isInImportBlock) {
      if (line === ')') {
        isInImportBlock = false;
      }
      importBlock += line + '\n';
    } else if (line != "") {
      lines = fileContent.split('\n')
      for (; i < lines.length; i++) {
        
        line = lines[i]
        code += line + '\n';
      }
      break
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
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (workspaceFolder) {
    const rootPath = workspaceFolder.uri.fsPath;
    const mainGoPath = path.join(rootPath, 'main.go')
    const solutionGoPath = path.join(rootPath, 'solution.go')

    importsAnalyzed.clear()
    importToAnalyze.length = 0
    finalCode = ''
    finalImports = new Set<string>()

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
    const outputContent =
    `// Generated with https://github.com/lorenzotinfena/go-aggregator
// Original source code:
/*
${originalSolutionGo}
*/
package main
import (\n${Array.from(finalImports).join('\n')}
)
${finalCode}`
copy(outputContent);

    vscode.window.showInformationMessage('Aggregated!');
  }
}
export function activate(context: vscode.ExtensionContext) {
  
	const disposable = vscode.commands.registerCommand('go-aggregator.aggregate', () => {
		aggregate();
	});

	context.subscriptions.push(disposable);
}