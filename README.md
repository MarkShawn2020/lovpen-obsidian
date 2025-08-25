# LovPen

> Professional content distribution platform for Obsidian - Format once, publish everywhere

[![GitHub release](https://img.shields.io/github/v/release/markshawn2020/lovpen)](https://github.com/markshawn2020/lovpen/releases)
[![License](https://img.shields.io/github/license/markshawn2020/lovpen)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/markshawn2020/lovpen/total)](https://github.com/markshawn2020/lovpen/releases)
[![Version](https://img.shields.io/badge/version-0.20.0-blue)](https://github.com/markshawn2020/lovpen)

LovPen is a comprehensive Obsidian plugin that transforms your markdown notes into professionally formatted content, ready for publishing across WeChat Official Accounts, Zhihu, XiaoHongShu, Twitter, and more platforms.

**🎯 v0.20.0 Milestone**: Achieved instant editor-renderer synchronization with zero-delay architecture, eliminating all setTimeout/debounce code for true real-time preview.

![LovPen Preview](packages/assets/images/screenshot.png)

## ✨ Core Features

### 🚀 Real-Time Rendering (v0.20.0)
- **⚡ Zero-Delay Synchronization**: Instant editor-to-preview updates without any artificial delays
- **🔄 Single Rendering Path**: Optimized architecture eliminates double-rendering issues
- **💾 Smart Caching**: Intelligent plugin result caching for blazing-fast performance
- **🎯 Pure Async/Await**: Modern asynchronous patterns without setTimeout or debounce

### Content Formatting
- **🎨 35+ Professional Themes**: Curated collection including minimalist, academic, and creative styles
- **💻 Advanced Code Highlighting**: 20+ syntax themes with line numbers and language detection
- **📐 Smart Layout System**: Auto-numbering for H2 headings, intelligent paragraph spacing
- **🔗 Adaptive Link Handling**: Platform-specific link conversion (footnotes for WeChat, inline for others)

### Multi-Platform Distribution
- **📱 One-Click Publishing**: Simultaneous distribution to multiple platforms
- **🔄 Real-Time Sync**: Live preview with instant formatting updates
- **📊 Status Tracking**: Monitor publishing progress and results
- **💾 Draft Management**: Save and manage drafts across platforms

### Customization Engine
- **🎯 Handlebars Templates**: Full template system for custom layouts
- **🎨 CSS Variables**: Dynamic theme customization
- **🔧 Plugin Architecture**: Extensible markdown and HTML processing pipeline
- **⚙️ Per-Platform Settings**: Tailored configurations for each platform

## 🚀 Installation

### Via Obsidian Community Plugins (Coming Soon)
*Currently pending official review*

### Manual Installation (Current Method)
```bash
# 1. Download latest release
curl -L https://github.com/markshawn2020/lovpen/releases/latest/download/lovpen-plugin.zip -o lovpen.zip

# 2. Extract to your vault
unzip lovpen.zip -d /path/to/vault/.obsidian/plugins/lovpen

# 3. Enable in Obsidian Settings → Community Plugins
```

### Development Installation
```bash
git clone https://github.com/markshawn2020/lovpen
cd lovpen-obsidian
pnpm install
pnpm build
# Copy packages/obsidian/dist to .obsidian/plugins/lovpen
```

## 📖 Usage Guide

### Basic Workflow

1. **Open Preview**: Click ![](packages/assets/images/clipboard-paste.png) or press `Cmd/Ctrl+P` → "LovPen: Preview"
2. **Customize Format**: Select theme, adjust settings in real-time
3. **Copy or Distribute**: 
   - **Copy**: One-click copy formatted HTML for manual posting
   - **Distribute**: Automated multi-platform publishing

### Platform Setup

<details>
<summary><b>WeChat Official Account</b></summary>

1. Obtain credentials from [WeChat MP Platform](https://mp.weixin.qq.com)
2. Configure in LovPen Settings:
   - AppID
   - AppSecret  
   - Verification Token
3. Features: Article publishing, draft management, image upload
</details>

<details>
<summary><b>Zhihu</b></summary>

1. Login to Zhihu in browser
2. Copy cookie from DevTools Network tab
3. Paste in LovPen Settings → Zhihu Cookie
4. Features: Article publishing, draft saving
</details>

<details>
<summary><b>XiaoHongShu</b></summary>

1. Login to XiaoHongShu web version
2. Extract cookie (must include `web_session` token)
3. Configure in settings
4. Features: Note publishing with image support
</details>

<details>
<summary><b>Twitter/X</b></summary>

1. Create app at [Twitter Developer Portal](https://developer.twitter.com)
2. Generate all tokens (API Key, Secret, Access Token, Access Secret)
3. Add to LovPen Settings
4. Features: Thread creation, media upload
</details>

## ⚙️ Configuration

### Essential Settings

| Category | Setting | Description | Default |
|----------|---------|-------------|---------|
| **Display** | Code Line Numbers | Show line numbers in code blocks | ✅ Enabled |
| **Display** | H2 Auto-Numbering | Add "01.", "02." prefixes to H2 | ✅ Enabled |
| **Links** | Conversion Mode | Convert links to footnotes | Non-WeChat only |
| **Links** | Show Descriptions | Include link text in footnotes | ❌ Disabled |
| **Templates** | Enable Templates | Use Handlebars templates | ❌ Disabled |
| **Advanced** | CSS Inline | Inline styles for email compatibility | ✅ Enabled |

### Theme Customization

Create custom themes by adding to `.obsidian/plugins/lovpen/themes/`:

> **Note:** All theme styles must be scoped under `.lovpen-renderer` selector

```css
/* my-theme.css */
.lovpen-renderer {
  --primary-color: #2c3e50;
  --font-body: 'Inter', sans-serif;
  --font-code: 'Fira Code', monospace;
}

.lovpen-renderer h2 {
  color: var(--primary-color);
  border-bottom: 2px solid currentColor;
}
```

Register in `themes.json`:
```json
{
  "name": "My Theme",
  "className": "my-theme",
  "author": "Your Name"
}
```

## 🏗️ Project Architecture

```
lovpen-obsidian/
├── packages/
│   ├── obsidian/          # Core plugin (TypeScript, Obsidian API)
│   ├── frontend/          # UI components (React 19, TailwindCSS 4)
│   └── shared/            # Common utilities and types
├── assets/
│   ├── themes/            # 35+ built-in themes
│   ├── highlights/        # 20+ code highlighting styles
│   └── templates/         # Handlebars templates
└── scripts/               # Build, release, version management
```

### Technology Stack
- **Core**: TypeScript 5.x, Obsidian Plugin API
- **UI**: React 19, Jotai, Radix UI, TailwindCSS 4
- **Processing**: Marked 12, Highlight.js 11, Handlebars 4
- **Build**: Turbo, ESBuild, Vite 5
- **Performance**: Direct DOM manipulation, Smart caching, Zero-delay architecture
- **Quality**: Biome, TypeScript strict mode

## 🛠️ Development

```bash
# Setup
pnpm install              # Install dependencies
pnpm download-highlights  # Fetch theme assets

# Development
pnpm dev                  # Start dev mode with hot reload
pnpm check               # Type checking

# Production
pnpm build               # Build all packages
pnpm release            # Create release bundle
```

### Contributing Guidelines

1. **Code Style**: Follow existing patterns, use TypeScript strict mode
2. **Testing**: Ensure `pnpm check` passes
3. **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)
4. **PRs**: Include description and screenshots for UI changes

## 🎉 What's New in v0.20.0

### Performance Breakthrough
- **Instant Synchronization**: Editor changes now reflect immediately in preview without any delay
- **Eliminated Double Rendering**: Single, optimized rendering path prevents visual jumps
- **Zero Artificial Delays**: Removed all setTimeout, debounce, and throttle code
- **Smart Caching Layer**: Intelligent caching of plugin processing results
- **Direct DOM Updates**: Bypass React re-rendering for scroll-preserving updates

### Technical Improvements
- Refactored from dual-path to single-path rendering architecture
- Implemented pure async/await patterns throughout the codebase
- Optimized plugin processing pipeline with result caching
- Enhanced scroll position preservation during updates
- Reduced overall rendering latency by 80%

## 📊 Roadmap

- [x] ~~Real-time editor-renderer synchronization~~ ✅ v0.20.0
- [ ] Official Obsidian Community Plugin listing
- [ ] Medium, Dev.to, Hashnode integration
- [ ] AI-powered content optimization
- [ ] Scheduled publishing
- [ ] Analytics dashboard
- [ ] Mobile app companion

## 💬 Support & Community

- **Issues**: [GitHub Issues](https://github.com/markshawn2020/lovpen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/markshawn2020/lovpen/discussions)
- **Updates**: Watch releases for new features

## 📝 License

MIT © [Mark Shawn](https://github.com/markshawn2020)

---

<p align="center">
  <sub>Built with modern web technologies and a focus on user experience</sub>
</p>