import {NMPSettings} from "../../settings";
import {logger} from "@lovpen/shared";
import {UnifiedPlugin} from "./unified-plugin-system";
import {IHtmlPlugin, PluginMetadata, PluginType} from "./types";

/**
 * HTML插件基类
 */
export abstract class HtmlPlugin extends UnifiedPlugin implements IHtmlPlugin {
	/**
	 * 获取插件元数据
	 */
	getMetadata(): PluginMetadata {
		return {
			name: this.getPluginName(),
			type: PluginType.HTML,
			description: this.getPluginDescription()
		};
	}

	/**
	 * 获取插件名称 - 子类必须实现
	 */
	abstract getPluginName(): string;

	/**
	 * 获取插件描述 - 子类可选实现
	 */
	getPluginDescription(): string {
		return "";
	}

	/**
	 * 处理HTML内容 - 子类必须实现
	 */
	abstract process(html: string, settings: NMPSettings): string;

	/**
	 * 获取主题色
	 */
	protected getThemeColor(settings: NMPSettings): string {
		let themeAccentColor: string;

		if (settings.enableThemeColor) {
			themeAccentColor = settings.themeColor || "#5B7083";
		} else {
			try {
				// 查找已有的 .lovpen-renderer 元素（可能在 Shadow DOM 内）
				let rendererEl = document.querySelector(".lovpen-renderer");
				if (!rendererEl) {
					// 搜索 Shadow DOM 内的元素
					const shadowHosts = document.querySelectorAll("*");
					for (const host of shadowHosts) {
						if (host.shadowRoot) {
							rendererEl = host.shadowRoot.querySelector(".lovpen-renderer");
							if (rendererEl) break;
						}
					}
				}

				let primaryColor = "";
				if (rendererEl) {
					primaryColor = window.getComputedStyle(rendererEl)
						.getPropertyValue("--primary-color")
						.trim();
				}

				themeAccentColor = primaryColor || "#5B7083";
			} catch (e) {
				themeAccentColor = "#5B7083";
				logger.error("无法获取主题色变量，使用默认值", e);
			}
		}

		return themeAccentColor;
	}
}
