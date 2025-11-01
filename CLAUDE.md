# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发原则
- 禁止写回退策略
- 禁止写测试方案
- 不允许加重试机制
- 你不要 pnpm dev 测试

## 项目选型
- 包管理器：pnpm

## 开发指南
- 你无需自行构建，因为本地已有 pnpm dev 启动
- 你无需构建项目进行测试，因为本地在run dev
- 请不要build，check就可以
- 你只需要pnpm check 检测语法问题即可，不用 build，因为会干扰本地的dev

## 项目架构

这是一个 Obsidian 插件项目（LovPen），用于将 Obsidian 笔记格式化并分发到多个平台（微信公众号、知乎、小红书、Twitter）。

### 工作区结构
项目使用 pnpm workspace + Turbo monorepo，包含三个主要包：

- `packages/obsidian/` - Obsidian 插件核心
- `packages/frontend/` - React 前端组件（使用 Vite + React + TailwindCSS）
- `packages/shared/` - 共享工具库

### 核心架构组件

#### Obsidian 插件层 (`packages/obsidian/`)
- **主入口**: `main.ts` - LovpenPlugin 类，管理插件生命周期
- **视图系统**: `note-preview-external.tsx` - 预览界面
- **设置管理**: `setting-tab.ts` + `settings.ts` - 插件配置
- **资源管理**: `assets.ts` - 主题和代码高亮资源
- **模板系统**: 
  - `template-manager.ts` - 模板管理
  - `template-kit-manager.ts` - 模板套装管理
- **插件系统**: 
  - `markdown-plugins/` - Markdown 处理插件
  - `html-plugins/` - HTML 后处理插件
  - `shared/` - 统一插件管理系统

#### 前端组件层 (`packages/frontend/`)
- **主组件**: `src/components/LovpenReact.tsx` - 核心 React 组件
- **工具栏**: `src/components/toolbar/` - 预览界面工具栏组件
- **设置界面**: `src/components/settings/` - 配置相关组件
- **状态管理**: `src/store/atoms.ts` - 使用 Jotai 进行状态管理
- **服务层**: `src/services/` - 图像生成、持久化存储等服务

#### 核心功能模块
1. **内容处理管道**: Markdown → HTML → 样式应用 → 平台适配
2. **主题系统**: 30+ 预设主题，支持自定义主题
3. **代码高亮**: highlight.js 集成，多种高亮样式
4. **模板引擎**: Handlebars 模板支持
5. **多平台分发**: 微信公众号、知乎、小红书、Twitter API 集成

## 常用开发命令

### 根目录命令
```bash
pnpm dev          # 启动所有包的开发模式 (Turbo)
pnpm dev:web      # 启动 Web 端开发服务器 (localhost:1101)
pnpm build        # 构建所有包 (Turbo)
pnpm check        # 类型检查所有包 (Turbo)
pnpm download-highlights  # 下载代码高亮样式
pnpm version      # 同步版本号到所有包
pnpm release      # 执行发布流程
```

### 包级别命令
在 `packages/obsidian/`:
```bash
pnpm dev          # 开发模式（esbuild watch）
pnpm build        # 生产构建
pnpm check        # TypeScript 类型检查
```

在 `packages/frontend/`:
```bash
pnpm dev          # Vite 构建 watch 模式
pnpm dev:serve    # Vite 开发服务器
pnpm build        # TypeScript + Vite 构建
pnpm check        # TypeScript 类型检查
```

## 关键技术栈

- **构建工具**: ESBuild (Obsidian), Vite (Frontend), Turbo (Monorepo)
- **前端框架**: React 19 + TypeScript
- **样式**: TailwindCSS 4.x + Radix UI
- **状态管理**: Jotai
- **内容处理**: Marked + highlight.js + Handlebars
- **插件架构**: 统一插件系统支持 Markdown 和 HTML 处理
- **样式内联**: juice (CSS inline 处理)
- **开发调试**: Code Inspector (增强版) - 点击页面元素跳转到源码

## 插件开发说明

### 添加新的 Markdown 处理插件
在 `packages/obsidian/markdown-plugins/` 中添加新插件，并在 `index.ts` 中注册。

### 添加新的 HTML 处理插件
在 `packages/obsidian/html-plugins/` 中添加新插件，使用 remark/rehype 插件系统。

### 主题开发
1. 在 `packages/assets/themes/` 添加 CSS 文件
2. 在 `packages/assets/themes.json` 中注册主题元数据

## Web 端支持

项目现已支持独立的 Web 端运行，无需 Obsidian 即可使用核心功能。

### 启动 Web 端
```bash
pnpm dev:web
```

访问 `http://localhost:1101` 即可使用 Web 版本。

### Web 端架构
- **入口文件**: `packages/frontend/index.html` + `src/dev.tsx`
- **适配层**: `packages/frontend/src/adapters/web-adapter.ts`
  - 提供 Obsidian API 的 Web 版本实现
  - Notice → Web 通知系统
  - requestUrl → Fetch API
  - persistentStorage → localStorage

### Web 端特性
- ✅ 完整的 UI 组件（React + TailwindCSS）
- ✅ Markdown 渲染和预览
- ✅ 主题切换（30+ 预设主题）
- ✅ 代码高亮（highlight.js）
- ✅ 设置持久化（localStorage）
- ✅ 热模块替换（HMR）
- ⚠️ 文件系统访问受限（需手动上传）
- ⚠️ 部分 Obsidian 特有功能不可用

## Code Inspector - 源码调试工具

项目已集成 **Code Inspector (Enhanced)** - 一个强大的开发调试工具，可以点击页面元素直接跳转到源码。

### 功能特性

#### 1. IDE 模式（默认）📝
点击页面任意元素 → 自动在 IDE 中打开对应源文件，并定位到精确的行列位置。

#### 2. 复制模式（增强功能）📋
点击页面任意元素 → 复制文件路径到剪贴板，格式：`/path/to/file.tsx:42:10`

#### 3. 快捷键操作
- **激活工具**: `Shift + Alt` (Windows) 或 `Shift + Option` (Mac)
- **切换模式**: 按 `C` 键在 IDE 模式和复制模式之间切换
- **点击元素**: 激活后点击任意页面元素

#### 4. 视觉反馈
- 🔔 Toast 通知提示当前模式
- 🎯 状态指示器显示在覆盖层
- 📍 精确的源码位置定位

### 使用场景

**IDE 模式**：
- 快速定位组件源码
- 修复 UI bug
- 理解组件实现逻辑
- 快速代码导航

**复制模式**：
- 分享代码位置给团队成员
- 创建 Issue 引用
- 编写技术文档
- 终端快速导航 (`code $(pbpaste)`)

### 支持的 IDE

✅ VSCode | ✅ Cursor | ✅ Windsurf | ✅ WebStorm | ✅ Atom | ✅ HBuilderX | ✅ PhpStorm | ✅ PyCharm | ✅ IntelliJ IDEA

### 控制台提示

启动开发服务器后，你会看到：
```
[code-inspector-plugin] Press and hold ⌥option + shift to enable the feature...
```

### 配置位置

- **配置文件**: `packages/frontend/vite.config.ts:22-24`
- **依赖包**: `@markshawn/code-inspector-plugin` (增强版)
- **原项目**: [zh-lx/code-inspector](https://github.com/zh-lx/code-inspector)
- **增强版**: [MarkShawn2020/code-inspector](https://github.com/MarkShawn2020/code-inspector)

### 环境变量

开发时可设置以下环境变量：
- `OBSIDIAN_VAULT_PATH` - Obsidian 仓库路径
- `OBSIDIAN_PLUGIN_PATH` - 插件目录路径（用于自动复制构建结果）

## SuperCompact 记录

最后执行时间: 2025-07-12T19:30:00Z
执行内容: 会话压缩 + 自动提交 + 项目文件更新
会话内容: 实现工具栏固定宽度拖拽、档案库瀑布流布局优化、移除封面库功能
- 禁止build/dev，只需要pnpm check即可，本地有服务器在dev运行