const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
	// 注册命令
	context.subscriptions.push(vscode.commands.registerCommand('superreplace.addRule', function () {
		vscode.window.showInformationMessage('Hello World from superreplace!');
	}));

	// 注册视图
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(
		'superreplace.home',
		new class {
			resolveWebviewView(webviewView) {
				webviewView.webview.options = {
					enableScripts: true,
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'assets')]
				};
				webviewView.webview.html = fs.readFileSync(path.join(__dirname, 'assets', 'panel.html'), 'utf-8');
				webviewView.webview.onDidReceiveMessage(message => {
					if (message.command === 'hello') {
						vscode.commands.executeCommand('myExtension.helloWorld');
					}
				});
			}
		}
	));
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
