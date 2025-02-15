// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

let aggregatedContent = '';
let accumulatedFiles: string[] = [];

export function activate(context: vscode.ExtensionContext) {
  const addFileDisposable = vscode.commands.registerCommand(
    'ez-compose.addFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('There is no active editor');
        return;
      }

      const note = await vscode.window.showInputBox({
        prompt: 'Add note:',
      });

      if (note === undefined) {
        return;
      }

      const fileUri = editor.document.uri;
      const relativePath = vscode.workspace.asRelativePath(fileUri);

      accumulatedFiles.push(relativePath);

      const fileText = editor.document.getText();

      const diagnostics = vscode.languages.getDiagnostics(fileUri);
      const errorDiagnostics = diagnostics.filter(
        (diag) => diag.severity === vscode.DiagnosticSeverity.Error
      );

      let errorsText = '';
      if (errorDiagnostics.length > 0) {
        errorsText = errorDiagnostics
          .map((diag) => {
            const line = diag.range.start.line + 1;
            return `Line ${line}: ${diag.message}`;
          })
          .join('\n');
      }

      const entry = `file: ${relativePath}
  notes: ${note}
  code:
  ${fileText}
  ${errorsText ? `errors:\n${errorsText}` : ''}
  ----------------------\n`;

      aggregatedContent += entry;

      try {
        await vscode.env.clipboard.writeText(aggregatedContent);
        const filesListMessage = accumulatedFiles.join(', ');
        vscode.window.showInformationMessage(
          'File added and accumulated content copied to clipboard. ',
          {
            modal: true,
            detail: `Files:\n${filesListMessage}`,
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage('Error copying content to clipboard');
      }
    }
  );

  const clearAggregatedDisposable = vscode.commands.registerCommand(
    'ez-compose.clearAggregated',
    () => {
      aggregatedContent = '';
      vscode.window.showInformationMessage('Accumulated content cleared');
    }
  );

  context.subscriptions.push(addFileDisposable, clearAggregatedDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
