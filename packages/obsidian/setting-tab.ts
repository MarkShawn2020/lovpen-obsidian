import {App, FileSystemAdapter, Notice, PluginSettingTab, Setting, TextAreaComponent,} from "obsidian";
import LovpenPlugin from "./main";
import {cleanMathCache} from "./markdown-plugins/math";
import {LinkDescriptionMode, NMPSettings} from "./settings";
import TemplateManager from "./template-manager";
import {PlatformType} from "./types";

import {logger} from "../shared/src/logger";

export class LovpenSettingTab extends PluginSettingTab {
	plugin: LovpenPlugin;
	wxInfo: string;
	wxTextArea: TextAreaComponent | null;
	settings: NMPSettings;

	constructor(app: App, plugin: LovpenPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = NMPSettings.getInstance();
		this.wxInfo = this.parseWXInfo();
	}

	displayWXInfo(txt: string) {
		this.wxTextArea?.setValue(txt);
	}

	parseWXInfo() {
		const wxInfo = this.settings.wxInfo;
		if (wxInfo.length == 0) {
			return "";
		}

		let res = "";
		for (let wx of wxInfo) {
			res += `${wx.name}|${wx.appid}|********\n`;
		}
		return res;
	}

	async clear() {
		this.settings.wxInfo = [];
		await this.plugin.saveSettings();
		this.wxInfo = "";
		this.displayWXInfo("");
	}

	display() {
		const {containerEl} = this;

		containerEl.empty();

		this.wxInfo = this.parseWXInfo();

		new Setting(containerEl).setName("默认样式").addDropdown((dropdown) => {
			const styles = this.plugin.assetsManager.themes;
			for (let s of styles) {
				dropdown.addOption(s.className, s.name);
			}
			dropdown.setValue(this.settings.defaultStyle);
			dropdown.onChange(async (value) => {
				this.settings.defaultStyle = value;
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl).setName("代码高亮").addDropdown((dropdown) => {
			const styles = this.plugin.assetsManager.highlights;
			for (let s of styles) {
				dropdown.addOption(s.name, s.name);
			}
			dropdown.setValue(this.settings.defaultHighlight);
			dropdown.onChange(async (value) => {
				this.settings.defaultHighlight = value;
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName("在工具栏展示样式选择")
			.setDesc("建议在移动端关闭，可以增大文章预览区域")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.showStyleUI);
				toggle.onChange(async (value) => {
					this.settings.showStyleUI = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("脚注链接描述模式")
			.setDesc("控制脚注中链接的展示形式")
			.addDropdown((dropdown) => {
				dropdown.addOption("empty", "仅显示链接");
				dropdown.addOption("raw", "显示链接文本和链接");
				dropdown.setValue(this.settings.linkDescriptionMode);
				dropdown.onChange(async (value) => {
					this.settings.linkDescriptionMode =
						value as LinkDescriptionMode;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("文件嵌入展示样式")
			.addDropdown((dropdown) => {
				dropdown.addOption("quote", "引用");
				dropdown.addOption("content", "正文");
				dropdown.setValue(this.settings.embedStyle);
				dropdown.onChange(async (value) => {
					this.settings.embedStyle = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("数学公式语法")
			.addDropdown((dropdown) => {
				dropdown.addOption("latex", "latex");
				dropdown.addOption("asciimath", "asciimath");
				dropdown.setValue(this.settings.math);
				dropdown.onChange(async (value) => {
					this.settings.math = value;
					cleanMathCache();
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl).setName("显示代码行号").addToggle((toggle) => {
			toggle.setValue(this.settings.lineNumber);
			toggle.onChange(async (value) => {
				this.settings.lineNumber = value;
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName("启用微信代码格式化")
			.setDesc("输出符合微信公众号编辑器格式的代码块")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.enableWeixinCodeFormat);
				toggle.onChange(async (value) => {
					this.settings.enableWeixinCodeFormat = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("获取更多主题")
			.addButton((button) => {
				button.setButtonText("下载");
				button.onClick(async () => {
					button.setButtonText("下载中...");
					await this.plugin.assetsManager.downloadThemes();
					button.setButtonText("下载完成");
				});
			})
			.addButton((button) => {
				button.setIcon("folder-open");
				button.onClick(async () => {
					await this.plugin.assetsManager.openAssets();
				});
			});

		new Setting(containerEl).setName("清空主题").addButton((button) => {
			button.setButtonText("清空");
			button.onClick(async () => {
				await this.plugin.assetsManager.removeThemes();
				this.settings.resetStyelAndHighlight();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName("CSS代码片段")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.useCustomCss);
				toggle.onChange(async (value) => {
					this.settings.useCustomCss = value;
					await this.plugin.saveSettings();
				});
			})
			.addButton((button) => {
				button.setIcon("refresh-ccw");
				button.onClick(async () => {
					await this.plugin.assetsManager.loadCustomCSS();
					new Notice("刷新成功");
				});
			})
			.addButton((button) => {
				button.setIcon("folder-open");
				button.onClick(async () => {
					await this.plugin.assetsManager.openAssets();
				});
			});

		// 模板设置部分
		containerEl.createEl("h2", {text: "模板设置"});

		new Setting(containerEl)
			.setName("使用模板")
			.setDesc("启用后，将使用模板来包装渲染的内容")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.useTemplate);
				toggle.onChange(async (value) => {
					this.settings.useTemplate = value;
					await this.plugin.saveSettings();
				});
			});

		// 获取模板列表并显示下拉框
		const templateManager = TemplateManager.getInstance();
		const templates = templateManager.getTemplateNames();

		new Setting(containerEl)
			.setName("默认模板")
			.setDesc("选择默认使用的模板")
			.addDropdown((dropdown) => {
				// 添加模板选项
				templates.forEach((template) => {
					dropdown.addOption(template, template);
				});

				// 如果没有默认模板选项，但有模板列表，则设置第一个为默认
				if (
					templates.length > 0 &&
					!templates.includes(this.settings.defaultTemplate)
				) {
					this.settings.defaultTemplate = templates[0];
				}

				// 设置当前值
				if (templates.includes(this.settings.defaultTemplate)) {
					dropdown.setValue(this.settings.defaultTemplate);
				}

				dropdown.onChange(async (value) => {
					this.settings.defaultTemplate = value;
					await this.plugin.saveSettings();
				});
			});

		// 添加管理模板的按钮
		new Setting(containerEl)
			.setName("管理模板")
			.setDesc("创建、编辑或删除模板")
			.addButton((button) => {
				button.setButtonText("打开模板文件夹").onClick(() => {
					// 打开模板文件夹
					try {
						const {shell} = require("electron");
						const path = require("path");
						const adapter = this.app.vault.adapter as FileSystemAdapter;
						const vaultRoot = adapter.getBasePath();
						const templatesPath = `${this.app.vault.configDir}/plugins/obsidian-lovpen/templates/`;
						const dst = path.join(vaultRoot, templatesPath);
						shell.openPath(dst);
					} catch (error) {
						console.error("打开模板文件夹失败:", error);
						new Notice("打开模板文件夹失败！");
					}
				});
			})
			.addButton((button) => {
				button.setButtonText("重新加载模板").onClick(async () => {
					await templateManager.loadTemplates();
					new Notice("模板重新加载完成！");
					// 刷新设置界面
					this.display();
				});
			});

		// === 内容分发设置 ===
		containerEl.createEl("h2", {text: "内容分发设置"});
		containerEl.createEl("p", {
			text: "配置各平台的认证信息，以便将内容分发到对应平台。",
			cls: "setting-item-description"
		});

		// 加载现有配置
		const distributionConfig = this.settings.distributionConfig || {};
		if (!this.settings.distributionConfig) {
			this.settings.distributionConfig = {};
		}

		// 微信公众号平台配置
		const wxConfig = distributionConfig[PlatformType.WECHAT] || {};
		const wxAuthSection = containerEl.createDiv({cls: "platform-auth-section"});
		wxAuthSection.createEl("h3", {text: "微信公众号"});
		wxAuthSection.createEl("p", {
			text: "使用上方公众号配置，无需重复输入。",
			cls: "setting-item-description"
		});

		new Setting(wxAuthSection)
			.setName("启用微信公众号分发")
			.addToggle(toggle => {
				toggle.setValue(wxConfig.enabled || false);
				toggle.onChange(async (value) => {
					if (!distributionConfig[PlatformType.WECHAT]) {
						distributionConfig[PlatformType.WECHAT] = {};
					}
					distributionConfig[PlatformType.WECHAT].enabled = value;
					this.settings.distributionConfig = distributionConfig;
					await this.plugin.saveSettings();
					logger.info("已更新微信公众号分发设置");
				});
			});

	}
}
