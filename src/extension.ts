import * as vscode from 'vscode';
import * as fs from 'fs';

const importsAnalyzed: Set<string> = new Set();
const importToAnalyze: string[] = [];
let finalCode = '';

async function processImports(): Promise<void> {
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

function getPackageFiles(packageName: string): string[] {
  // Implement this function to return the list of files in the given package name
  // You can use the file system APIs or any other method to retrieve the list of files
  // and return them as an array of file paths.
  return [];
}

function analyzeImports(code: string): void {
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

function cleanCode(code: string): string {
  // Analyze imports in the current code
  analyzeImports(code);

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


async function aggregate(): Promise<void> {
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
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	const disposable = vscode.commands.registerCommand('go-aggregator.helloWorld', () => {
		aggregate();
	});

	context.subscriptions.push(disposable);
}