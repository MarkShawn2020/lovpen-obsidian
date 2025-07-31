# Entrepreneur Journey 创业者成长之旅主题使用指南

## 主题介绍

Entrepreneur Journey 是一个展现创业者成长历程的主题套装，通过5个阶段的渐变色彩，生动展现从创业初期到成熟期的心路历程。

## 5个成长阶段

1. **创世期（Genesis）** - 深黑到余烬橙（#000000 → #2a1005）
   - 象征：黑暗中的火种
   - 情绪：孤独、激情、初心

2. **探索期（Struggle）** - 黑色到迷雾灰（#000000 → #2f2f2f）
   - 象征：迷雾中前行
   - 情绪：迷茫、坚持、探索

3. **突破期（Breakthrough）** - 黑色到黎明金（#000000 → #4a3015）
   - 象征：曙光初现
   - 情绪：希望、兴奋、突破

4. **扩张期（Expansion）** - 黑色到活力紫（#000000 → #4c2348）
   - 象征：燃烧激情
   - 情绪：激情、快速、挑战

5. **成熟期（Mastery）** - 黑色到深邃蓝（#000000 → #132d4f）
   - 象征：深度沉淀
   - 情绪：智慧、稳健、深邃

## 使用方法

### 在 Obsidian 中使用

1. 打开 LovPen 插件
2. 选择「Entrepreneur Journey」模板套装
3. 使用以下标记来区分不同阶段：

```html
<div class="entrepreneur-stage entrepreneur-stage-genesis">
  创世期的内容...
</div>

<div class="entrepreneur-stage entrepreneur-stage-struggle">
  探索期的内容...
</div>
```

### 在微信公众号中使用

由于微信公众号只支持内联样式，需要使用特殊的写法：

#### 方法一：使用示例文档

1. 打开 `example-entrepreneur-wechat.md`
2. 复制需要的段落结构
3. 替换成你的内容
4. 粘贴到微信公众号编辑器

#### 方法二：手动添加样式

每个阶段使用以下内联样式：

**创世期样式**：
```html
<section style="background: #0a0a0a; background-image: linear-gradient(180deg, #000000 0%, #0d0705 25%, #1a0f0a 50%, #2a1005 100%); padding: 48px 24px; margin: 32px 0; border-radius: 12px; color: #e0e0e0; position: relative;">
  <h2 style="color: #ff6b35;">标题</h2>
  <p style="color: #b0b0b0; line-height: 1.8;">内容...</p>
</section>
```

**探索期样式**：
```html
<section style="background: #0f0f0f; background-image: linear-gradient(180deg, #000000 0%, #0a0a0a 25%, #1f1f1f 50%, #2f2f2f 100%); padding: 48px 24px; margin: 32px 0; border-radius: 12px; color: #d1d5db;">
  <h2 style="color: #9ca3af;">标题</h2>
  <p style="color: #9ca3af; line-height: 1.8;">内容...</p>
</section>
```

**突破期样式**：
```html
<section style="background: #1a0f05; background-image: linear-gradient(180deg, #000000 0%, #1a0a00 25%, #2a1a0a 50%, #4a3015 100%); padding: 48px 24px; margin: 32px 0; border-radius: 12px; color: #fef3c7;">
  <h2 style="color: #fbbf24;">标题</h2>
  <p style="color: #fed7aa; line-height: 1.8;">内容...</p>
</section>
```

**扩张期样式**：
```html
<section style="background: #1f0f1f; background-image: linear-gradient(180deg, #000000 0%, #140a14 25%, #2a142a 50%, #4c2348 100%); padding: 48px 24px; margin: 32px 0; border-radius: 12px; color: #f3e8ff;">
  <h2 style="color: #c084fc;">标题</h2>
  <p style="color: #e9d5ff; line-height: 1.8;">内容...</p>
</section>
```

**成熟期样式**：
```html
<section style="background: #0a1628; background-image: linear-gradient(180deg, #000000 0%, #050a14 25%, #0a1628 50%, #132d4f 100%); padding: 48px 24px; margin: 32px 0; border-radius: 12px; color: #e0e7ff;">
  <h2 style="color: #93bbfd;">标题</h2>
  <p style="color: #c7d2fe; line-height: 1.8;">内容...</p>
</section>
```

## 常见问题

### Q: 微信公众号中渐变不显示怎么办？

A: 部分微信版本可能不支持 `background-image: linear-gradient()`，可以改用纯色背景：

- 创世期：`background: #1a0f0a;`
- 探索期：`background: #1f1f1f;`
- 突破期：`background: #2a1a0a;`
- 扩张期：`background: #2a142a;`
- 成熟期：`background: #0a1628;`

### Q: 如何调整渐变的强度？

A: 可以通过修改渐变的百分比来调整过渡的速度。例如：
```css
linear-gradient(180deg, 
  #000000 0%,    /* 起始颜色 */
  #1a0f0a 30%,   /* 调整这个百分比 */
  #2a1005 100%   /* 结束颜色 */
)
```

### Q: 能否自定义颜色？

A: 可以！每个阶段的颜色都可以自定义：

1. 修改主题色（如 `#ff6b35`）
2. 调整文本颜色（如 `#e0e0e0`）
3. 更改背景渐变色

## 最佳实践

1. **内容结构**：按照时间顺序组织内容，每个阶段讲述不同的故事
2. **色彩呼应**：在每个阶段使用对应的强调色（如链接、重点文字）
3. **情绪递进**：从低谷到高峰，体现成长的过程
4. **适度留白**：每个阶段之间保持适当间距，让读者有呼吸感

## 示例文档

- `entrepreneur-journey-example.md` - Obsidian 版本示例
- `example-entrepreneur-wechat.md` - 微信公众号版本示例

祝您创作愉快！🚀