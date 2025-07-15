# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发原则
- 禁止写回退策略
- 禁止写测试方案
- 不允许加重试机制

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
项目使用 pnpm workspace，包含三个主要包：

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
pnpm dev          # 启动所有包的开发模式
pnpm build        # 构建所有包
pnpm check        # 类型检查所有包
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

### 特殊脚本
```bash
pnpm download-highlights  # 下载代码高亮样式
pnpm version             # 同步版本号
```

## 关键技术栈

- **构建工具**: ESBuild (Obsidian), Vite (Frontend)
- **前端框架**: React 19 + TypeScript
- **样式**: TailwindCSS 4.x + Radix UI
- **状态管理**: Jotai
- **内容处理**: Marked + highlight.js + Handlebars
- **插件架构**: 统一插件系统支持 Markdown 和 HTML 处理

## 插件开发说明

### 添加新的 Markdown 处理插件
在 `packages/obsidian/markdown-plugins/` 中添加新插件，并在 `index.ts` 中注册。

### 添加新的 HTML 处理插件
在 `packages/obsidian/html-plugins/` 中添加新插件，使用 remark/rehype 插件系统。

### 主题开发
1. 在 `packages/assets/themes/` 添加 CSS 文件
2. 在 `packages/assets/themes.json` 中注册主题元数据

## SuperCompact 记录

最后执行时间: 2025-07-12T19:30:00Z
执行内容: 会话压缩 + 自动提交 + 项目文件更新
会话内容: 实现工具栏固定宽度拖拽、档案库瀑布流布局优化、移除封面库功能