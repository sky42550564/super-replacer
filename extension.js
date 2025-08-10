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

function replaceViteResourcePaths(html, basePath, webview) {
	return html
		.replace(/<script (.*)src="([^"]+)"/g, (match, other, src) => {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(basePath, src));
			return `<script ${other}src="${uri}"`;
		})
		.replace(/<link (.*)href="([^"]+)"/g, (match,  other, href) => {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(basePath, href));
			return `<link ${other}href="${uri}"`;
		});
}

function activate(context) {
	// 注册命令
	context.subscriptions.push(vscode.commands.registerCommand('sr.addRule', () => {
		vscode.window.showErrorMessage('替换成功');
	}));

	// 注册视图
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('sr.sidebar', new class {
		resolveWebviewView(panel) {
			const basePath = vscode.Uri.joinPath(context.extensionUri, 'dist');
			panel.webview.options = {
				enableScripts: true,
				localResourceRoots: [basePath]
			};
			// const html = fs.readFileSync(path.join(context.extensionUri.fsPath, 'assets', 'panel.html'), 'utf-8');
			let html = fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8');
			html = replaceViteResourcePaths(fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8'), basePath, panel.webview);
			console.log('====================html=', html);
			panel.webview.html = html;
			panel.webview.onDidReceiveMessage(message => {
				if (message.command === 'updateList') {
					// rules = require('./assets/rules.js');
					// console.log('====================message=', message);
					// // fs.writeFileSync(path.join(__dirname, 'assets', 'rules.json'), message.rules);
					// for (const rule of rules) {
					// 	context.subscriptions.push(vscode.commands.registerCommand(`sr.${rule.name}`, () => {
					// 		// rule.callback();
					// 		vscode.window.showErrorMessage('替换成功' + rule.name);
					// 	}));
					// }
					// vscode.commands.executeCommand('setContext', 'extension.dynamicCommandAdded', true);
				} else if (message.command === 'execItem') {
					// vscode.commands.executeCommand('sr.hello');
				}
			});
			panel.webview.postMessage({
				type: 'setList',
				list: [],
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
