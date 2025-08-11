const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
let useCursorWord = false; // 是否替换光标处的单词
let replaceCallback = word => '123'; // 替换函数
let list = require('./assets/rules.js');
console.log('====================list=', list);

function replaceViteResourcePaths(html, distPath, webview) {
	return html
		.replace(/<script (.*)src="([^"]+)"/g, (match, other, src) => {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, src));
			return `<script ${other}src="${uri}"`;
		})
		.replace(/<link (.*)href="([^"]+)"/g, (match, other, href) => {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, href));
			return `<link ${other}href="${uri}"`;
		})
		.replace(`window.VSCODE_EXTENSION_ROOT = ''`, () => {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(distPath));
			return `window.VSCODE_EXTENSION_ROOT = '${uri}'`;
		});
}

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
		vscode.window.showErrorMessage('替换成功');
	}));

	// 注册视图
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('sr.sidebar', new class {
		resolveWebviewView(panel) {
			const distPath = vscode.Uri.joinPath(context.extensionUri, 'dist');
			panel.webview.options = {
				enableScripts: true,
				localResourceRoots: [distPath]
			};
			let html = fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8');
			html = replaceViteResourcePaths(fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8'), distPath, panel.webview);
			console.log('====================html=', html);
			panel.webview.html = html;
			panel.webview.onDidReceiveMessage(message => {
				if (message.type === 'updateList') {
					list = message.list;
					fs.writeFileSync(path.join(context.extensionUri.fsPath, 'assets', 'rules.js'), `module.exports=${JSON.stringify(message.list)}`, 'utf-8');
					// list = require('./assets/list.js');
					console.log('====================message=', message);
					// // fs.writeFileSync(path.join(__dirname, 'assets', 'list.json'), message.list);
					// for (const rule of list) {
					// 	context.subscriptions.push(vscode.commands.registerCommand(`sr.${rule.name}`, () => {
					// 		// rule.callback();
					// 		vscode.window.showErrorMessage('替换成功' + rule.name);
					// 	}));
					// }
					// vscode.commands.executeCommand('setContext', 'extension.dynamicCommandAdded', true);
				} else if (message.type === 'execItem') {
					// vscode.commands.executeCommand('sr.hello');
				} else if (message.type === 'initList') {
					panel.webview.postMessage({ type: 'setList', list });
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
