/**
 * Web Adapter for Obsidian API
 * 为 Web 端提供 Obsidian API 的替代实现
 */

export const isStandaloneMode = typeof __STANDALONE_MODE__ !== 'undefined' && __STANDALONE_MODE__;

// 简单的通知系统（Web 版）
class WebNotice {
	constructor(message: string, timeout?: number) {
		this.show(message, timeout);
	}

	private show(message: string, timeout: number = 3000) {
		// 创建通知元素
		const notice = document.createElement('div');
		notice.className = 'web-notice';
		notice.textContent = message;
		notice.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #1a1a1a;
			color: #fff;
			padding: 12px 20px;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			z-index: 10000;
			font-size: 14px;
			max-width: 300px;
			word-wrap: break-word;
			animation: slideIn 0.3s ease-out;
		`;

		// 添加动画
		const style = document.createElement('style');
		style.textContent = `
			@keyframes slideIn {
				from {
					transform: translateX(400px);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
			@keyframes slideOut {
				from {
					transform: translateX(0);
					opacity: 1;
				}
				to {
					transform: translateX(400px);
					opacity: 0;
				}
			}
		`;
		if (!document.querySelector('#web-notice-style')) {
			style.id = 'web-notice-style';
			document.head.appendChild(style);
		}

		document.body.appendChild(notice);

		// 自动移除
		setTimeout(() => {
			notice.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => {
				document.body.removeChild(notice);
			}, 300);
		}, timeout);
	}
}

// Web 版 requestUrl
interface RequestUrlResponse {
	text: string;
	json: any;
	arrayBuffer: ArrayBuffer;
	headers: Record<string, string>;
}

export const webRequestUrl = async (url: string): Promise<RequestUrlResponse> => {
	const response = await fetch(url);
	const text = await response.text();

	// 解析 headers
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});

	return {
		text,
		json: JSON.parse(text),
		arrayBuffer: await fetch(url).then(r => r.arrayBuffer()),
		headers,
	};
};

// 持久化存储（使用 localStorage）
export const webPersistentStorage = {
	async getItem(key: string): Promise<string | null> {
		return localStorage.getItem(key);
	},

	async setItem(key: string, value: string): Promise<void> {
		localStorage.setItem(key, value);
	},

	async removeItem(key: string): Promise<void> {
		localStorage.removeItem(key);
	},

	async clear(): Promise<void> {
		localStorage.clear();
	},
};

// 导出适配器
export const webAdapter = {
	Notice: WebNotice,
	requestUrl: webRequestUrl,
	persistentStorage: webPersistentStorage,
	isStandalone: isStandaloneMode,
};

export default webAdapter;
