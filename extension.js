const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('dayjs');
let list = require('./assets/rules.js');
let webview;

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
/*
function :直接返回为函数
字符串：
'=>123' :返回 123，可以使用 $, _, moment, utils 等符号
'=$123' :返回 input123 其中 $ 代表当前参数，直接替换
'return 123' :与 '=>123'相同，返回 123，可以使用 $, _, moment, utils 等符号
'({$, _, moment, utils})=>123' :返回 123
其他： 直接返回字符串
*/
function parseFunction(func) {
	if (_.isString(func)) {
		const _func = func.trim();
		const pre = /await /.test(_func) ? 'async' : '';
		if (/^=>/.test(_func)) {
			return (new Function(`return ${pre}({$,_,moment,utils}={})${_func}`))();
		} else if (/^=/.test(_func)) {
			return (new Function(`return ${pre}({$})=>'${_func.slice(1)}'.replace(/\\$/g, $)`))();
		} else if (/=>/.test(_func)) {
			return (new Function(`return ${_func}`))();
		} else if (/^return /.test(_func)) {
			return (new Function(`return ${pre}({$,_,moment,utils}={})=>{ ${_func} }`))();
		}
	}
	return func;
}
async function doCommand(item) {
	const editor = vscode.window.activeTextEditor;
	if (!editor)
		return vscode.window.showErrorMessage('没有打开的编辑器');

	const document = editor.document;
	const selection = editor.selection;
	const utils = { // 基础方法
		toast: (msg) => vscode.window.showErrorMessage(msg),
		copy: async () => await vscode.env.clipboard.readText(),
		paste: async (text) => await vscode.env.clipboard.writeText(text),
		filePath: () => document.uri.fsPath,
		fileName: () => path.basename(document.uri.fsPath),
		fileDir: () => path.dirname(document.uri.fsPath),
		fileExtname: () => path.extname(document.uri.fsPath),
		workspaceFolders: () => vscode.workspace.workspaceFolders,
	};

	let text = '', replaceSelection = selection;
	if (!selection.isEmpty) {
		text = document.getText(selection);
	} else {
		const range = document.getWordRangeAtPosition(selection.active); // 替换光标处的单词
		if (item.cursorWord) { // 取光标处的单词
			text = document.getText(range);
			replaceSelection = range;
		}
	}
	const func = parseFunction(item.command);
	console.log('=================func', func);
	const result = _.isFunction(func) ? await func({ $: text, _, moment, utils }) : func;
	await editor.edit(doc => {
		doc.replace(replaceSelection, result);
	});
}

function activate(context) {
	// 注册命令
	context.subscriptions.push(vscode.commands.registerCommand('sr.execCommand', async (index) => {
		await doCommand(list[index]);
	}));

	// 注册视图
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('sr.sidebar', new class {
		resolveWebviewView(panel) {
			const distPath = vscode.Uri.joinPath(context.extensionUri, 'dist');
			webview = panel.webview;
			panel.webview.options = {
				enableScripts: true,
				localResourceRoots: [distPath]
			};
			let html = fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8');
			html = replaceViteResourcePaths(fs.readFileSync(path.join(context.extensionUri.fsPath, 'dist', 'index.html'), 'utf-8'), distPath, panel.webview);
			// console.log('html=', html);
			panel.webview.html = html;
			panel.webview.onDidReceiveMessage(message => {
				if (message.type === 'updateList') {
					list = message.list;
					fs.writeFileSync(path.join(context.extensionUri.fsPath, 'assets', 'rules.js'), `module.exports=${JSON.stringify(message.list)}`, 'utf-8');
				} else if (message.type === 'execItem') {
					vscode.commands.executeCommand('sr.execCommand', message.index);
				} else if (message.type === 'initList') {
					panel.webview.postMessage({ type: 'setList', list });
				}
			});
		}
	}));
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
