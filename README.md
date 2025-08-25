# LovPen

> Professional content distribution platform for Obsidian - Format once, publish everywhere

[![GitHub release](https://img.shields.io/github/v/release/markshawn2020/lovpen)](https://github.com/markshawn2020/lovpen/releases)
[![License](https://img.shields.io/github/license/markshawn2020/lovpen)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/markshawn2020/lovpen/total)](https://github.com/markshawn2020/lovpen/releases)

LovPen is a powerful Obsidian plugin that transforms your notes into beautifully formatted content ready for publishing across multiple platforms including WeChat Official Accounts, Zhihu, XiaoHongShu, and Twitter.

![LovPen Preview](packages/assets/images/screenshot.png)

## ✨ Key Features

- **🎨 30+ Beautiful Themes**: Choose from a curated collection of professional themes
- **📱 Multi-Platform Publishing**: One-click distribution to WeChat, Zhihu, XiaoHongShu, Twitter
- **🔗 Smart Link Handling**: Intelligent footnotes for non-clickable platforms like WeChat
- **💻 Syntax Highlighting**: Beautiful code blocks with line numbers and multiple highlight styles
- **📐 Template System**: Customize content rendering with Handlebars templates
- **🔢 Auto-Numbering**: Automatic H2 heading numbering for better structure

## 🚀 Quick Start

### Installation

#### Option 1: Manual Installation (Recommended)
1. Download the latest `lovpen-plugin.zip` from [Releases](https://github.com/markshawn2020/lovpen/releases)
2. Extract to `.obsidian/plugins/` in your vault
3. Enable "LovPen" in Obsidian Settings → Community plugins

#### Option 2: BRAT Plugin
1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. Add beta plugin with URL: `https://github.com/markshawn2020/lovpen`

### Basic Usage

1. Open any note in Obsidian
2. Click the LovPen icon ![](packages/assets/images/clipboard-paste.png) in the sidebar or use `Ctrl+P` → "Copy to WeChat"
3. Preview your formatted content
4. Click **Copy** to copy formatted content, or **Distribute** to publish to multiple platforms

## 📤 Content Distribution

### Supported Platforms

| Platform | Authentication Required | Features |
|----------|------------------------|----------|
| WeChat Official Account | AppID, AppSecret, Token | Direct publishing, draft support |
| Zhihu | Cookie | Article publishing, draft support |
| XiaoHongShu | Cookie | Note publishing with images |
| Twitter | API Keys & Tokens | Tweet with thread support |

### Platform Configuration

1. Open Obsidian Settings → LovPen
2. Navigate to "Content Distribution Settings"
3. Configure authentication for desired platforms:
   - **WeChat**: Enter AppID, AppSecret, and Token
   - **Zhihu/XiaoHongShu**: Paste login cookie from browser
   - **Twitter**: Add API credentials from Twitter Developer Portal

### Publishing Workflow

1. Format your content in the preview panel
2. Click **Distribute** button in toolbar
3. Select target platforms
4. Choose **Publish** or **Save as Draft**
5. Monitor real-time publishing status

## ⚙️ Configuration

### Essential Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Code Line Numbers** | Show line numbers in code blocks | Enabled |
| **H2 Auto-Numbering** | Add numbers to H2 headings (01., 02., etc.) | Enabled |
| **Link Conversion** | Convert links to footnotes | Non-WeChat links only |
| **Template System** | Use templates for content wrapping | Disabled |

### Advanced Features

#### Custom Themes
1. Add theme definition to `themes.json`
2. Create corresponding CSS file in `themes/` directory
3. All styles should be scoped under `.note-to-mp` class

#### Template Customization
- Location: `.obsidian/plugins/lovpen/templates/`
- Engine: Handlebars
- Variables: `{{content}}`, `{{title}}`, custom metadata

## 🏗️ Project Structure

```
lovpen-obsidian/
├── packages/
│   ├── obsidian/          # Core plugin logic
│   ├── frontend/          # React UI components
│   └── shared/            # Shared utilities
├── assets/
│   ├── themes/            # Theme CSS files
│   └── highlights/        # Code highlighting styles
└── scripts/               # Build and release scripts
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Type checking
pnpm check

# Build for production
pnpm build

# Download theme assets
pnpm download-highlights
```

### Tech Stack
- **Framework**: Obsidian Plugin API
- **UI**: React 19 + TypeScript
- **Styling**: TailwindCSS 4.x
- **Build**: Turbo + ESBuild + Vite
- **Markdown**: Marked + Highlight.js

## 📝 License

MIT © [Mark Shawn](https://github.com/markshawn2020)

## 🙏 Acknowledgments

Based on [sunbooshi/note-to-mp](https://github.com/sunbooshi/note-to-mp) - Thanks to the original author for the foundation.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📮 Support

- [Report Issues](https://github.com/markshawn2020/lovpen/issues)
- [Feature Requests](https://github.com/markshawn2020/lovpen/issues/new)
- [Discussions](https://github.com/markshawn2020/lovpen/discussions)

---

<p align="center">
  Made with ❤️ for the Obsidian community
</p>