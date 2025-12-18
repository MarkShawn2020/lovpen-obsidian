<p align="center">
  <img src="docs/images/cover.png" alt="LovPen Cover" width="100%">
</p>

<h1 align="center">
  <img src="assets/logo.svg" width="32" height="32" alt="Logo" align="top">
  LovPen
</h1>

<p align="center">
  <strong>Format once, publish everywhere</strong><br>
  <sub>WeChat · Zhihu · XiaoHongShu · Twitter</sub>
</p>

<p align="center">
  <a href="https://github.com/markshawn2020/lovpen/releases"><img src="https://img.shields.io/github/v/release/markshawn2020/lovpen" alt="GitHub release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/markshawn2020/lovpen" alt="License"></a>
  <a href="https://github.com/markshawn2020/lovpen/releases"><img src="https://img.shields.io/github/downloads/markshawn2020/lovpen/total" alt="Downloads"></a>
</p>

---

LovPen transforms your Obsidian markdown notes into professionally formatted content for multi-platform distribution.

![LovPen Preview](packages/assets/images/screenshot.png)

## Features

### Real-Time Rendering
- **Zero-Delay Sync**: Instant editor-to-preview updates
- **Single Rendering Path**: No double-rendering or visual jumps
- **Smart Caching**: Intelligent plugin result caching

### Content Formatting
- **35+ Themes**: Minimalist, academic, and creative styles
- **Code Highlighting**: 20+ syntax themes with line numbers
- **Smart Layout**: Auto-numbering H2 headings, intelligent spacing
- **Adaptive Links**: Platform-specific conversion (footnotes for WeChat)

### Multi-Platform
- **One-Click Publishing**: Simultaneous distribution
- **Live Preview**: Real-time formatting updates
- **Draft Management**: Save and manage drafts

### Customization
- **Handlebars Templates**: Full template system
- **CSS Variables**: Dynamic theme customization
- **Plugin Architecture**: Extensible processing pipeline

## Installation

### Manual Installation
```bash
curl -L https://github.com/markshawn2020/lovpen/releases/latest/download/lovpen-plugin.zip -o lovpen.zip
unzip lovpen.zip -d /path/to/vault/.obsidian/plugins/lovpen
```

### Development
```bash
git clone https://github.com/markshawn2020/lovpen
cd lovpen-obsidian
pnpm install
pnpm build
```

## Usage

1. **Open Preview**: `Cmd/Ctrl+P` → "LovPen: Preview"
2. **Customize**: Select theme, adjust settings
3. **Distribute**: Copy or auto-publish to platforms

### Platform Setup

<details>
<summary><b>WeChat Official Account</b></summary>

1. Get credentials from [WeChat MP Platform](https://mp.weixin.qq.com)
2. Configure AppID, AppSecret, Verification Token in settings
</details>

<details>
<summary><b>Zhihu</b></summary>

1. Login to Zhihu in browser
2. Copy cookie from DevTools → Settings
</details>

<details>
<summary><b>XiaoHongShu</b></summary>

1. Login to XiaoHongShu web
2. Extract cookie with `web_session` token
</details>

<details>
<summary><b>Twitter/X</b></summary>

1. Create app at [Twitter Developer Portal](https://developer.twitter.com)
2. Generate all tokens and add to settings
</details>

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Code Line Numbers | Show in code blocks | ✅ |
| H2 Auto-Numbering | Add "01.", "02." prefixes | ✅ |
| Link Conversion | Convert to footnotes | Non-WeChat |
| CSS Inline | Inline styles for compatibility | ✅ |

### Custom Themes

Add to `.obsidian/plugins/lovpen/themes/`:

```css
/* my-theme.css - must scope under .lovpen-renderer */
.lovpen-renderer {
  --primary-color: #2c3e50;
  --font-body: 'Inter', sans-serif;
}
```

## Architecture

```
lovpen-obsidian/
├── packages/
│   ├── obsidian/      # Core plugin (TypeScript, Obsidian API)
│   ├── frontend/      # UI (React 19, TailwindCSS 4, Jotai)
│   └── shared/        # Common utilities
└── assets/
    ├── themes/        # 35+ built-in themes
    └── highlights/    # 20+ code styles
```

### Tech Stack
- **Core**: TypeScript, Obsidian Plugin API
- **UI**: React 19, Jotai, Radix UI, TailwindCSS 4
- **Processing**: Marked, Highlight.js, Handlebars
- **Build**: Turbo, ESBuild, Vite

## Development

```bash
pnpm install              # Install dependencies
pnpm download-highlights  # Fetch theme assets
pnpm dev                  # Start dev mode
pnpm check                # Type checking
```

## Roadmap

- [x] Real-time editor-renderer sync
- [ ] Official Obsidian Community Plugin listing
- [ ] Medium, Dev.to integration
- [ ] AI-powered content optimization
- [ ] Scheduled publishing

## Support

- [GitHub Issues](https://github.com/markshawn2020/lovpen/issues)
- [GitHub Discussions](https://github.com/markshawn2020/lovpen/discussions)

## License

MIT © [Mark Shawn](https://github.com/markshawn2020)
