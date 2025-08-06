const vscode = require('vscode');

function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('superreplace.addRule', function () {
		vscode.window.showInformationMessage('Hello World from superreplace!');
	}));
	// 2. 注册视图提供器（定义面板内容）
	const provider = new class {
		resolveWebviewView(webviewView) {
			// 配置Webview
			webviewView.webview.options = {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
			};

			// 设置面板HTML内容
			webviewView.webview.html = `
				<!DOCTYPE html>
				<html lang="zh-CN">
				<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>我的插件面板</title>
						<style>
								body { padding: 1rem; }
								button { 
										background: var(--vscode-button-background);
										color: var(--vscode-button-foreground);
										border: none;
										padding: 0.5rem 1rem;
										border-radius: 4px;
										cursor: pointer;
								}
								button:hover {
										background: var(--vscode-button-hoverBackground);
								}
						</style>
				</head>
				<body>
						<h1>欢迎使用我的插件</h1>
						<p>这是左侧图标栏的自定义面板</p>
						<button id="btn">点击我</button>

						<script>
								// 与插件通信
								const vscode = acquireVsCodeApi();
								document.getElementById('btn').addEventListener('click', () => {
										vscode.postMessage({ command: 'hello' });
								});
						</script>
				</body>
				</html>
		`;

			// 监听面板消息
			webviewView.webview.onDidReceiveMessage(message => {
				if (message.command === 'hello') {
					vscode.commands.executeCommand('myExtension.helloWorld');
				}
			});
		}
	};

	let viewProvider = vscode.window.registerWebviewViewProvider(
		'superreplace.home',
		provider
	);

	// 订阅命令和视图
	context.subscriptions.push(helloCommand, viewProvider);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
