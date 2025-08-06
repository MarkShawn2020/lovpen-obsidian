# HMR (Hot Module Replacement) Development Guide

## 🚀 Quick Start

启用 HMR 开发模式，实现 React 组件的热更新，无需重新构建和重载 Obsidian。

### 使用方法

1. **启动 HMR 开发模式**
   ```bash
   pnpm dev:hmr
   ```
   这会同时启动：
   - Vite Dev Server (http://localhost:5173) - 提供 HMR 支持
   - Obsidian 插件 watch 模式 - 监听插件代码变化

2. **首次启动后，重载 Obsidian** (Cmd+R / Ctrl+R)

3. **开始开发**
   - 修改 `packages/frontend/src` 中的 React 组件
   - 保存后会自动热更新，无需重载 Obsidian
   - 修改 `packages/obsidian` 中的插件代码后需要重载 Obsidian

## 🔄 工作原理

1. **开发模式检测**
   - 插件会检测是否有 Vite Dev Server 运行在 localhost:5173
   - 如果检测到，会从 Dev Server 加载 React 组件而非打包文件

2. **HMR 支持**
   - Vite 通过 WebSocket 连接实现热更新
   - React Fast Refresh 保持组件状态
   - CSS 更改即时生效

3. **回退机制**
   - 如果 Dev Server 未运行，自动使用打包版本
   - 确保插件始终可用

## 📝 注意事项

- HMR 仅影响 React 组件和样式
- Obsidian 插件核心代码修改仍需重载
- 首次启动 HMR 模式后需要重载一次 Obsidian
- 确保端口 5173 未被占用

## 🛠️ 传统开发模式

如果不需要 HMR，可以使用传统的 watch 模式：
```bash
pnpm dev
```

## 🐛 故障排除

1. **HMR 不工作**
   - 检查 Vite Dev Server 是否运行: `curl http://localhost:5173`
   - 查看 Obsidian 开发者控制台是否有错误
   - 尝试重载 Obsidian

2. **端口冲突**
   - 修改 `packages/frontend/vite.config.ts` 中的端口配置
   - 同步更新 `packages/obsidian/note-preview-external.tsx` 中的 URL

3. **样式未更新**
   - 确认 Vite Dev Server 正在运行
   - 检查浏览器控制台的网络请求