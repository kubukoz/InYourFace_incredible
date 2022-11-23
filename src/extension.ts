// A lot of the code used to make this extension is from the following repos:
// https://github.com/phindle/error-lens/blob/master/src/extension.ts
// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample
// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample
// https://code.visualstudio.com/api/extension-guides/webview
// and more that I can't find anymore

"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(vscode.languages.onDidChangeDiagnostics(() => provider.changed()));
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(CustomSidebarViewProvider.viewType, provider));
}

const FACES = [
  {minErrors: 0, asset: "incredible0.png"},
  {minErrors: 1, asset: "incredible1.png"},
  {minErrors: 5, asset: "incredible2.png"},
  {minErrors: 10, asset: "incredible3.png"},
].reverse();

type Face = (typeof FACES)[0];

class CustomSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "in-your-face.openview";

  view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  changed() {
    const errorCount = getNumErrors();
    if (!this.view) { return; }
    const face = FACES.find(face => errorCount >= face.minErrors)!;

    this.view.webview.html = this.getHtmlContent(this.view.webview, face);
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    //ensurs assets can load
    webviewView.webview.options = { };
    this.changed();
  }


  private getHtmlContent(webview: vscode.Webview, face: Face): string {
    const face0 = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", face.asset));

    return getHtml(face0);
  }
}

function getHtml(doomFace: unknown) {
  return `
    <!DOCTYPE html>
			<html lang="en">
			<head>

			</head>

			<body>
			<section class="wrapper">
      <img class="doomFaces" src="${doomFace}" alt="" >
      <h1 id="errorNum">${getNumErrors() + " error(s)"}</h1>
			</section>
      <script>

      </script>
      </body>

		</html>
  `;
}

// function to get the number of errors in the open file
function getNumErrors(): number {
  const activeTextEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return 0;
  }
  const document: vscode.TextDocument = activeTextEditor.document;

  const numErrors =
    vscode.languages
      .getDiagnostics(document.uri)
      .filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;

  return numErrors;
}
