# 二级标题序号功能实现说明

本文档详细记录了 LovPen 插件中二级标题序号功能的设计、实现和最佳实践，为后续功能扩展提供参考。

## 1. 功能概述

二级标题序号功能允许用户在微信公众号内容排版时，自动为二级标题（H2，即 `##` 开头的标题）添加序号，使内容层次更清晰，排版更加规范美观。功能特点：

- 默认启用，为所有二级标题添加形如 "01."、"02." 格式的序号
- 可在预览界面工具栏中通过开关随时切换是否启用
- 同时作用于 Markdown 处理和 HTML 渲染两个环节，确保微信公众号显示效果一致

## 2. 技术实现

### 2.1 设置配置

在 `settings.ts` 中添加了 `enableHeadingNumber` 配置选项用于存储用户偏好：

```typescript
// 在 NMPSettings 类中添加配置项
enableHeadingNumber: boolean = true; // 默认启用二级标题序号
```

### 2.2 Markdown 内容处理

在 `note-preview.ts` 中添加了 `processHeadingNumbers` 方法，用于在 Markdown 渲染前处理二级标题：

```typescript
processHeadingNumbers(markdown: string): string {
    // 如果用户关闭了二级标题序号功能，直接返回原始内容
    if (!this.settings.enableHeadingNumber) {
        return markdown;
    }

    // 使用正则表达式匹配二级标题（## 开头的行）
    const h2Regex = /^##\s+(.+?)$/gm;
    
    // 保存已找到的标题
    let headings: { index: number; title: string }[] = [];
    let match: RegExpExecArray | null;
    
    // 查找所有二级标题
    while ((match = h2Regex.exec(markdown)) !== null) {
        headings.push({
            index: match.index,
            title: match[1].trim(),
        });
    }
    
    // 如果没有找到二级标题，直接返回原始内容
    if (headings.length === 0) {
        return markdown;
    }
    
    // 从原始内容构建新内容，逐个替换标题
    let result = "";
    let lastIndex = 0;
    
    headings.forEach((heading, index) => {
        // 添加当前标题之前的内容
        result += markdown.substring(lastIndex, heading.index);
        
        // 格式化编号为两位数 01, 02, 03...
        const number = (index + 1).toString().padStart(2, "0");
        
        // 添加带序号的二级标题
        result += `## ${number}. ${heading.title}`;
        
        // 更新lastIndex为当前匹配结束位置
        lastIndex = heading.index + 3 + heading.title.length; // 3是"## "的长度
    });
    
    // 添加最后一个标题之后的内容
    result += markdown.substring(lastIndex);
    
    return result;
}
```

### 2.3 HTML 渲染处理

在 `wechat-adapter.ts` 的 `processHeadings` 方法中，添加了对用户设置的尊重：

```typescript
private processHeadings(html: string): string {
    try {
        // 如果用户关闭了二级标题序号功能，直接返回原始 HTML
        if (!this.currentSettings.enableHeadingNumber) {
            logger.debug("二级标题序号功能已关闭，不添加序号");
            return html;
        }
        
        // 其他处理逻辑...
    } catch (e) {
        logger.error("处理标题时出错：", e);
        return html;
    }
}
```

### 2.4 用户界面控制

在 `note-preview.ts` 中添加了 `buildHeadingNumberSettings` 方法，创建了一个开关控件，允许用户随时切换二级标题序号功能：

```typescript
buildHeadingNumberSettings(parent: HTMLElement) {
    // 创建操作项容器
    const headingSection = parent.createDiv({
        cls: "toolbar-section",
    });

    // 创建标题
    headingSection.createEl("h3", {
        text: "二级标题序号",
    });

    // 创建操作容器
    const headingControlWrapper = headingSection.createDiv({
        cls: "control-wrapper",
    });

    // 创建开关选项
    const enableSwitch = headingControlWrapper.createDiv({
        cls: "enable-switch",
    });

    // 创建开关按钮
    const toggleSwitch = enableSwitch.createEl("label", { cls: "switch" });
    
    // 只设置 type 属性，不设置 checked 属性
    const toggleInput = toggleSwitch.createEl("input", {
        attr: {
            type: "checkbox",
        },
    });
    
    // 用 DOM 属性而非 HTML 属性设置选中状态
    toggleInput.checked = this.settings.enableHeadingNumber;
    
    toggleSwitch.createEl("span", { cls: "slider round" });

    // 开关文本
    enableSwitch.createEl("span", {
        text: this.settings.enableHeadingNumber ? "已启用" : "已关闭",
        cls: "switch-label",
    });

    // 监听开关事件
    toggleInput.addEventListener("change", () => {
        this.settings.enableHeadingNumber = toggleInput.checked;
        enableSwitch.querySelector(".switch-label").textContent = 
            toggleInput.checked ? "已启用" : "已关闭";
        this.saveSettingsToPlugin();
        this.renderMarkdown();
    });
}
```

## 3. 最佳实践总结

### 3.1 UI 控件状态同步

**问题**：在使用 Obsidian API 创建 checkbox 控件时，使用 HTML 属性 `checked` 无法正确反映 `false` 状态。

**解决方案**：使用 DOM 属性（property）而非 HTML 属性（attribute）来设置 checkbox 状态：

```typescript
// 错误方式：使用 HTML 属性
const toggleInput = toggleSwitch.createEl("input", {
    attr: {
        type: "checkbox",
        checked: booleanValue, // 即使 booleanValue 是 false，checkbox 仍会被选中
    },
});

// 正确方式：使用 DOM 属性
const toggleInput = toggleSwitch.createEl("input", {
    attr: { type: "checkbox" },
});
toggleInput.checked = booleanValue; // 正确处理布尔值
```

### 3.2 数据流设计

优化了组件内部数据流，将数据状态集中到 `settings` 对象：

1. 使用 getter 方法替代独立属性，确保始终使用最新设置：
   ```typescript
   // 从
   currentTheme: string;
   
   // 改为
   get currentTheme() {
       return this.settings.defaultStyle;
   }
   ```

2. 将设置变更与 UI 更新解耦，确保单一数据源：
   ```typescript
   toggleInput.addEventListener("change", () => {
       // 1. 更新设置
       this.settings.enableHeadingNumber = toggleInput.checked;
       // 2. 更新 UI 显示
       enableSwitch.querySelector(".switch-label").textContent = 
           toggleInput.checked ? "已启用" : "已关闭";
       // 3. 持久化设置
       this.saveSettingsToPlugin();
       // 4. 重新渲染内容
       this.renderMarkdown();
   });
   ```

### 3.3 功能适配器模式

使用适配器模式处理不同渲染阶段的二级标题序号：

1. **Markdown 处理阶段**：在 `processHeadingNumbers` 中处理原始 Markdown
2. **HTML 渲染阶段**：在 `WeChatAdapter.processHeadings` 中处理 HTML

这种分层处理确保了无论在哪个环节，都能尊重用户设置，保持功能一致性。

## 4. 后续优化方向

1. **更多定制选项**：提供更多序号格式选项，如"(1)"、"1."等多种序号样式
2. **更多标题级别支持**：扩展到支持三级标题（H3）序号
3. **序号模板系统**：允许用户自定义序号格式模板
4. **性能优化**：探索更高效的正则匹配和处理方法

## 5. 测试注意事项

1. 确保在切换设置后，实时预览效果符合预期
2. 验证设置持久化和加载是否正常工作
3. 测试在微信公众号预览和实际发布中的效果一致性
4. 验证大型文档的处理性能
