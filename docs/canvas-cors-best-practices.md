# Canvas 截图中的跨域图片处理最佳实践

## 问题背景

在使用 Canvas 或截图库（如 `html2canvas`、`modern-screenshot`）将网页内容转换为图片时，如果页面中包含外部图片（如 OSS、CDN 等），经常会遇到 CORS（跨域资源共享）限制，导致截图中的图片无法显示。

### 典型错误信息

```
Access to image at 'https://example.com/image.png' from origin 'https://yoursite.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

## 常见的错误方案

### ❌ 方案 1：直接设置 `crossOrigin="anonymous"`

```typescript
// 不推荐：很多图片服务器不支持 CORS
img.crossOrigin = 'anonymous';
```

**问题**：如果图片服务器没有设置 `Access-Control-Allow-Origin` 响应头，浏览器会直接阻止请求。

### ❌ 方案 2：使用 `mode: 'no-cors'`

```typescript
// 不推荐：会返回不透明响应
fetch(imageUrl, { mode: 'no-cors' })
```

**问题**：`no-cors` 模式虽然能发送请求，但返回的是不透明响应（opaque response），无法读取响应内容，Canvas 仍然无法使用。

## ✅ 推荐方案：预转换为 Data URL

### 核心思路

在截图前，将所有外部图片下载并转换为 Data URL（base64），然后临时替换页面中的图片源，截图完成后再恢复。

### 实现步骤

#### 1. Electron/Desktop 环境（如 Obsidian）

使用 Electron 或特权 API 可以绕过浏览器的 CORS 限制：

```typescript
import { requestUrl } from 'obsidian'; // 或其他特权 API
import { domToPng } from 'modern-screenshot';

async function screenshotWithCORS(element: HTMLElement) {
  // 1. 找到所有图片元素
  const images = element.querySelectorAll('img');
  const imageData = new Map<HTMLImageElement, {
    originalSrc: string;
    dataUrl?: string
  }>();

  // 2. 并行下载所有外部图片并转换为 data URL
  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      imageData.set(img, { originalSrc: src });

      // 跳过已经是 data URL 的图片
      if (src.startsWith('data:')) {
        return;
      }

      try {
        // 使用特权 API 下载图片（绕过 CORS）
        const response = await requestUrl({ url: src });

        // 转换为 Blob
        const blob = new Blob([response.arrayBuffer], {
          type: response.headers['content-type'] || 'image/png'
        });

        // Blob 转 data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // 3. 临时替换图片源
        imageData.get(img)!.dataUrl = dataUrl;
        img.src = dataUrl;

        console.log('图片已转换:', src);
      } catch (error) {
        console.warn('图片加载失败，使用原始 URL:', src, error);
        // 失败也继续，不阻塞整个流程
      }
    })
  );

  // 4. 执行截图
  const screenshot = await domToPng(element, {
    quality: 1,
    scale: 2, // 2倍分辨率
  });

  // 5. 恢复原始图片 URL
  images.forEach(img => {
    const data = imageData.get(img);
    if (data && data.dataUrl) {
      img.src = data.originalSrc;
    }
  });

  return screenshot;
}
```

#### 2. 浏览器环境（需要代理服务器）

普通浏览器环境无法绕过 CORS，需要通过代理服务器：

```typescript
async function screenshotWithProxy(element: HTMLElement) {
  const images = element.querySelectorAll('img');
  const imageData = new Map<HTMLImageElement, {
    originalSrc: string;
    dataUrl?: string
  }>();

  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      imageData.set(img, { originalSrc: src });

      if (src.startsWith('data:')) {
        return;
      }

      try {
        // 方案 A: 使用自己的代理服务器
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(src)}`;
        const response = await fetch(proxyUrl);

        // 方案 B: 使用第三方 CORS 代理（不推荐生产环境）
        // const response = await fetch(`https://cors-anywhere.herokuapp.com/${src}`);

        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        imageData.get(img)!.dataUrl = dataUrl;
        img.src = dataUrl;
      } catch (error) {
        console.warn('图片加载失败:', src, error);
      }
    })
  );

  const screenshot = await domToPng(element, {
    quality: 1,
    scale: 2,
  });

  images.forEach(img => {
    const data = imageData.get(img);
    if (data && data.dataUrl) {
      img.src = data.originalSrc;
    }
  });

  return screenshot;
}
```

#### 3. 代理服务器示例（Node.js + Express）

```javascript
// server.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*'); // 根据需要调整
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Failed to fetch image');
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
```

## 性能优化建议

### 1. 添加超时机制

```typescript
async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}
```

### 2. 图片缓存

```typescript
const imageCache = new Map<string, string>();

async function getCachedDataUrl(url: string): Promise<string> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const dataUrl = await downloadAndConvert(url);
  imageCache.set(url, dataUrl);
  return dataUrl;
}
```

### 3. 限制并发数

```typescript
async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// 使用示例：限制同时下载 5 张图片
await limitConcurrency(
  Array.from(images).map(img => () => downloadImage(img.src)),
  5
);
```

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| Data URL 预转换 | 完全绕过 CORS，100% 成功率 | 需要下载图片，可能较慢 | Desktop 应用、Electron |
| 代理服务器 | 可在浏览器中使用 | 需要额外服务器，增加延迟 | Web 应用 |
| 服务端渲染 | 服务端无 CORS 限制 | 需要完整的后端架构 | 大型 Web 应用 |
| CORS 头配置 | 最简单，性能最好 | 需要控制图片服务器 | 自有 CDN/OSS |

## 安全注意事项

### 1. 防止 SSRF 攻击

```typescript
// 白名单验证
const ALLOWED_DOMAINS = [
  'example.com',
  'cdn.example.com',
  'oss-cn-hangzhou.aliyuncs.com'
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain ||
      parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
```

### 2. 限制文件大小

```typescript
async function downloadWithSizeLimit(url: string, maxSize = 10 * 1024 * 1024) {
  const response = await fetch(url);
  const contentLength = response.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error(`Image too large: ${contentLength} bytes`);
  }

  return response;
}
```

### 3. 内容类型验证

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

function validateImageType(blob: Blob): boolean {
  return ALLOWED_MIME_TYPES.includes(blob.type);
}
```

## 完整示例

综合以上所有最佳实践的完整实现：

```typescript
import { requestUrl } from 'obsidian';
import { domToPng } from 'modern-screenshot';

interface ImageConversionResult {
  success: number;
  failed: number;
  total: number;
}

async function screenshotWithExternalImages(
  element: HTMLElement,
  options: {
    timeout?: number;
    maxSize?: number;
    allowedDomains?: string[];
  } = {}
): Promise<{ dataUrl: string; stats: ImageConversionResult }> {
  const {
    timeout = 5000,
    maxSize = 10 * 1024 * 1024,
    allowedDomains = []
  } = options;

  const images = element.querySelectorAll('img');
  const stats: ImageConversionResult = {
    success: 0,
    failed: 0,
    total: images.length
  };

  const imageData = new Map<HTMLImageElement, {
    originalSrc: string;
    dataUrl?: string;
  }>();

  console.log(`开始处理 ${images.length} 张图片...`);

  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      imageData.set(img, { originalSrc: src });

      // 跳过 data URL
      if (src.startsWith('data:')) {
        stats.success++;
        return;
      }

      // 域名白名单验证（如果提供）
      if (allowedDomains.length > 0) {
        try {
          const url = new URL(src);
          const isAllowed = allowedDomains.some(domain =>
            url.hostname === domain ||
            url.hostname.endsWith(`.${domain}`)
          );
          if (!isAllowed) {
            console.warn('域名不在白名单中:', url.hostname);
            stats.failed++;
            return;
          }
        } catch {
          stats.failed++;
          return;
        }
      }

      try {
        // 使用超时控制
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        );

        const downloadPromise = (async () => {
          // 下载图片
          const response = await requestUrl({ url: src });

          // 检查文件大小
          if (response.arrayBuffer.byteLength > maxSize) {
            throw new Error('Image too large');
          }

          // 创建 Blob
          const blob = new Blob([response.arrayBuffer], {
            type: response.headers['content-type'] || 'image/png'
          });

          // 转换为 data URL
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })();

        const dataUrl = await Promise.race([
          downloadPromise,
          timeoutPromise
        ]) as string;

        imageData.get(img)!.dataUrl = dataUrl;
        img.src = dataUrl;
        stats.success++;

        console.log(`✓ 已转换: ${src.substring(0, 50)}...`);
      } catch (error) {
        stats.failed++;
        console.warn(`✗ 转换失败: ${src}`, error);
      }
    })
  );

  console.log(`图片转换完成: 成功 ${stats.success}, 失败 ${stats.failed}`);

  // 执行截图
  const dataUrl = await domToPng(element, {
    quality: 1,
    scale: 2,
  });

  // 恢复原始 URL
  images.forEach(img => {
    const data = imageData.get(img);
    if (data && data.dataUrl) {
      img.src = data.originalSrc;
    }
  });

  return { dataUrl, stats };
}

// 使用示例
const result = await screenshotWithExternalImages(
  document.querySelector('.article')!,
  {
    timeout: 5000,
    maxSize: 10 * 1024 * 1024,
    allowedDomains: ['oss-cn-hangzhou.aliyuncs.com']
  }
);

console.log('截图完成:', result.stats);
console.log('Data URL 长度:', result.dataUrl.length);
```

## 常见问题

### Q1: 为什么不直接在服务端截图？

服务端截图（如使用 Puppeteer）可以完全避免 CORS 问题，但：
- 需要额外的服务器资源
- 响应时间较长
- 无法实时预览
- 成本较高

客户端截图更适合需要实时反馈的场景。

### Q2: Data URL 会不会太大？

Data URL 确实会比 URL 字符串大：
- Base64 编码会增加约 33% 体积
- 建议只在截图时临时转换
- 截图完成后立即恢复原始 URL
- 考虑实现图片缓存机制

### Q3: 如何处理 SVG 图片？

SVG 的处理需要特别注意：

```typescript
if (img.src.endsWith('.svg') || response.headers['content-type'] === 'image/svg+xml') {
  // SVG 可以直接转为 data URL，无需 Blob
  const svgText = new TextDecoder().decode(response.arrayBuffer);
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
  img.src = dataUrl;
}
```

## 总结

处理 Canvas 截图中的跨域图片问题，核心方案是：

1. **预转换为 Data URL**（Desktop 环境首选）
2. **使用代理服务器**（Web 环境备选）
3. **配置 CORS 头**（自有服务器理想方案）

选择方案时考虑：
- 运行环境（Desktop vs Web）
- 性能要求
- 安全要求
- 实现复杂度

---

**最佳实践更新于**: 2025-01-09
**相关库**: `modern-screenshot`, `html2canvas`, `dom-to-image`
