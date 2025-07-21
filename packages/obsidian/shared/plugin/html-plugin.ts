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
			themeAccentColor = settings.themeColor || "#7852ee";
			logger.debug("使用自定义主题色：", themeAccentColor);
		} else {
			try {
				const testElement = document.createElement("div");
				testElement.style.display = "none";
				testElement.className = "lovpen";
				document.body.appendChild(testElement);

				const computedStyle = window.getComputedStyle(testElement);
				const primaryColor = computedStyle
					.getPropertyValue("--primary-color")
					.trim();

				logger.debug("获取到的主题色：", primaryColor);
				if (primaryColor) {
					themeAccentColor = primaryColor;
				} else {
					themeAccentColor = "#7852ee";
				}

				document.body.removeChild(testElement);
			} catch (e) {
				themeAccentColor = "#7852ee";
				logger.error("无法获取主题色变量，使用默认值", e);
			}
		}

		return themeAccentColor;
	}
}
