const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
let useCursorWord = false; // 是否替换光标处的单词
let replaceCallback = word => '123'; // 替换函数
let rules = [];

function replace() {
	const editor = vscode.window.activeTextEditor;
	if (!editor)
		return vscode.window.showErrorMessage('没有打开的编辑器');

	const document = editor.document;
	const selection = editor.selection;

	if (!selection.isEmpty) {
		const text = document.getText(selection);
		editor.edit(edit => {
			edit.replace(selection, replaceCallback(text));
		});
		return vscode.window.showErrorMessage('替换成功');
	}
	const range = document.getWordRangeAtPosition(selection.active);
	if (useCursorWord) { // 替换光标处的单词
		const text = document.getText(range);
		editor.edit(edit => {
			edit.replace(selection, replaceCallback(text));
		});
		return vscode.window.showErrorMessage('替换成功');
	}
	editor.edit(edit => {
		edit.insert(selection.active, replaceCallback());
	});
}

function activate(context) {
	// 注册命令
	context.subscriptions.push(vscode.commands.registerCommand('sr.addRule', () => {
	}));

	// 注册视图
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(
		'sr.home',
		new class {
			resolveWebviewView(webviewView) {
				webviewView.webview.options = {
					enableScripts: true,
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'assets')]
				};
				webviewView.webview.html = fs.readFileSync(path.join(__dirname, 'assets', 'panel.html'), 'utf-8');
				webviewView.webview.onDidReceiveMessage(message => {
					if (message.command === 'saveRules') {
						rules = require('./assets/rules.js');
						console.log('====================rules=', rules);
						// fs.writeFileSync(path.join(__dirname, 'assets', 'rules.json'), message.rules);
						for (const rule of rules) {
							context.subscriptions.push(vscode.commands.registerCommand(`sr.${rule.name}`, () => {
								rule.callback();
							}));
						}
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
