# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发约束（Critical）
- **禁止 build/dev**: 本地已有 pnpm dev 运行，只需 `pnpm check` 检测语法问题
- 禁止写回退策略、测试方案、重试机制

## 常用命令
```bash
pnpm check            # 类型检查（主要使用）
pnpm download-highlights  # 下载代码高亮样式
```

## 项目架构

Obsidian 插件项目，将 Markdown 笔记格式化并分发到微信公众号、知乎、小红书、Twitter。

### Monorepo 结构（pnpm workspace + Turbo）
- `packages/obsidian/` - Obsidian 插件核心（ESBuild）
- `packages/frontend/` - React UI 组件（Vite + React 19 + TailwindCSS 4 + Jotai）
- `packages/shared/` - 共享工具库

### 内容处理管道
Markdown → HTML → 样式应用 → 平台适配

关键模块：
- 插件入口: `packages/obsidian/main.ts`
- 核心 UI: `packages/frontend/src/components/LovpenReact.tsx`
- 状态管理: `packages/frontend/src/store/atoms.ts`
- Markdown 插件: `packages/obsidian/markdown-plugins/`
- HTML 插件: `packages/obsidian/html-plugins/`

### Web 端
- 入口: `packages/frontend/src/dev.tsx`
- 适配层: `packages/frontend/src/adapters/web-adapter.ts`（模拟 Obsidian API）

## 扩展开发

### 添加 Markdown 处理插件
在 `packages/obsidian/markdown-plugins/` 添加并在 `index.ts` 注册

### 添加主题
1. 在 `packages/assets/themes/` 添加 CSS
2. 在 `packages/assets/themes.json` 注册
