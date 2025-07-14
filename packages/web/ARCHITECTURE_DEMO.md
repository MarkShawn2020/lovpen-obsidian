# 智能侧边栏架构演示

## 🎯 新的设置层级

### **🌐 全局层 (Document Level)**
```typescript
// 适用于整个文档的通用设置
{
  contentTemplate: 'blog',        // 博客文章
  targetAudience: 'general',      // 普通读者
  autoImage: true,                // 自动配图
  seoOptimization: false,         // SEO优化
  scheduledPublishing: false      // 定时发布
}
```

### **📱 平台层 (Platform Level)**
```typescript
// 每个平台独有的设置
wechat: {
  articleLength: 'medium',        // 中等长度 (800-1200字)
  writingStyle: 'professional',   // 专业严谨
  imageCompression: 'medium',     // 中等压缩
  linkHandling: 'convert-to-text', // 转为文本
  includeCallToAction: true       // 包含行动号召
}

xiaohongshu: {
  articleLength: 'short',         // 短文 (300-500字)
  writingStyle: 'casual',         // 轻松活泼  
  imageCompression: 'high',       // 高压缩
  useHashtags: true,              // 使用标签
  includeCallToAction: true       // 包含行动号召
}
```

## 🔄 用户交互流程

### **场景1: 首次创作**
1. **全局模式**: 设置内容模板(博客)、目标受众(普通读者)
2. **添加平台**: 添加微信、小红书预览面板
3. **平台优化**: 点击单个面板，调整平台特定设置
4. **内容生成**: AI根据每个平台设置生成优化内容

### **场景2: 批量调整**
1. **多选平台**: Ctrl+点击多个面板
2. **批量模式**: 统一调整写作风格为"专业严谨"
3. **个性化**: 单独为小红书设置"轻松活泼"风格
4. **重新生成**: 根据新设置重新生成内容

## 💡 架构优势

### **智能默认值**
- **微信**: 中等长度 + 专业风格 (适合深度阅读)
- **小红书**: 短文 + 轻松风格 (适合快速浏览)
- **知乎**: 长文 + 深度思考 (适合专业讨论)
- **Twitter**: 短文 + 简洁风格 (适合社交传播)

### **灵活覆盖**
- **继承全局**: 平台设置为空时使用全局设置
- **平台优先**: 平台特定设置覆盖全局设置
- **智能提示**: 超出平台限制时显示警告

### **高效工作流**
- **一键适配**: 根据平台特性自动优化
- **批量操作**: 多平台统一调整
- **个性定制**: 单平台精细控制