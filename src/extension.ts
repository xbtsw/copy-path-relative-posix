import * as vscode from 'vscode';

const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';
const modulesFolder = 'modules/';
const possibleExts = ['.ts', '.tsx'];

enum PathKind {
  Import,
  Export
}
function createPath(kind: PathKind) {
  return (arg1: any, arg2: any) => {
    let resources: vscode.Uri[] | undefined;
    if (Array.isArray(arg2)) {
      resources = arg2;
    } else if (arg1) {
      resources = [arg1];
    } else {
      if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri) {
        resources = [vscode.window.activeTextEditor.document.uri];
      }
    }

    if (resources) {
      const relativePaths: string[] = [];
      for (const resource of resources) {
        let relativePath = vscode.workspace.asRelativePath(resource, false);
        if (relativePath) {
          relativePath = isWindows ? relativePath.replace(/\\/g, '/') : relativePath;
          if (relativePath.startsWith(modulesFolder)) {
            relativePath = relativePath.slice(modulesFolder.length);
          }
          for (const ext in possibleExts) {
            if (relativePath.endsWith(ext)) {
              relativePath = relativePath.slice(0, relativePath.length - ext.length);
            }
          }
          if (kind === PathKind.Import) {
            relativePath = `import {} from '${relativePath}'`;
          } else {
            relativePath = `export * from '${relativePath}'`;
          }
          relativePaths.push(relativePath);
        }
      }

      if (relativePaths.length > 0) {
        vscode.env.clipboard.writeText(relativePaths.join(lineDelimiter));
      }
    }
  };
}
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('copyImportPath', createPath(PathKind.Import)));
  context.subscriptions.push(vscode.commands.registerCommand('copyExportPath', createPath(PathKind.Export)));
}

export function deactivate() { }
