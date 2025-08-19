// 需要渲染进inline style的css样式
export default `
/* --------------------------------------- */
/* Admonition 组件 - 使用语义化 data 属性选择器 */
/* --------------------------------------- */

/* 基础容器样式 - 增强视觉存在感 */
[data-component="admonition"] {
  border: none;
  padding: 1.25em 1.5em;
  display: flex;
  flex-direction: column;
  margin: 1.5em 0;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  background: white;
  position: relative;
}

/* Anthropic Style 主题特定样式 */
#render-container [data-component="admonition"] {
  border-radius: 12px;
  padding: 1.5em;
  box-shadow: 0 2px 8px rgba(200, 100, 66, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 249, 245, 0.9) 100%);
}

/* 头部容器 - 更清晰的层级 */
[data-element="admonition-header"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 1.05em;
  font-weight: 600;
  margin-bottom: 0.75em;
  opacity: 0.95;
}

/* 图标容器 - 增大尺寸 */
[data-element="admonition-icon"] {
  display: inline-block;
  width: 24px;
  height: 24px;
  margin-right: 0.75em;
  flex-shrink: 0;
}

[data-element="admonition-icon"] svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Anthropic Style 主题 - 低调图标样式 */
#render-container [data-element="admonition-icon"] svg {
  opacity: 0.6;
  stroke-width: 1.5;
  transform: scale(0.9);
  transition: opacity 0.2s ease;
}

#render-container [data-component="admonition"]:hover [data-element="admonition-icon"] svg {
  opacity: 0.8;
}

/* 标题文本 */
[data-element="admonition-title"] {
  flex: 1;
  line-height: 1.4;
}

/* 内容区域 - 更好的可读性 */
[data-element="admonition-content"] {
  color: rgb(55, 65, 81);
  font-size: 0.95em;
  line-height: 1.7;
  padding-left: calc(24px + 0.75em); /* 与图标对齐 */
}

[data-element="admonition-content"] > *:first-child {
  margin-top: 0;
}

[data-element="admonition-content"] > *:last-child {
  margin-bottom: 0;
}

/* --------------------------------------- */
/* Admonition 类型变体样式 */
/* --------------------------------------- */

/* Note/Info/Todo 类型 - 柔和的蓝色系 */
[data-component="admonition"][data-type="note"],
[data-component="admonition"][data-type="info"],
[data-component="admonition"][data-type="todo"] {
  color: rgb(37, 99, 235);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
  border-left-color: rgb(59, 130, 246);
}

/* Anthropic Style 主题 - Note 类型 */
#render-container [data-component="admonition"][data-type="note"],
#render-container [data-component="admonition"][data-type="info"],
#render-container [data-component="admonition"][data-type="todo"] {
  color: rgb(200, 100, 66);
  background: linear-gradient(135deg, rgba(200, 100, 66, 0.05) 0%, rgba(250, 249, 245, 0.9) 100%);
  border-left-color: rgb(200, 100, 66);
}

/* Tip/Abstract/Summary/Hint/Important 类型 - 柔和的青色系 */
[data-component="admonition"][data-type="tip"],
[data-component="admonition"][data-type="abstract"],
[data-component="admonition"][data-type="summary"],
[data-component="admonition"][data-type="tldr"],
[data-component="admonition"][data-type="hint"],
[data-component="admonition"][data-type="important"] {
  color: rgb(13, 148, 136);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
  border-left-color: rgb(20, 184, 166);
}

/* Anthropic Style 主题 - Tip 类型 */
#render-container [data-component="admonition"][data-type="tip"],
#render-container [data-component="admonition"][data-type="abstract"],
#render-container [data-component="admonition"][data-type="summary"],
#render-container [data-component="admonition"][data-type="tldr"],
#render-container [data-component="admonition"][data-type="hint"],
#render-container [data-component="admonition"][data-type="important"] {
  color: rgb(180, 85, 50);
  background: linear-gradient(135deg, rgba(200, 100, 66, 0.08) 0%, rgba(250, 249, 245, 0.95) 100%);
  border-left-color: rgb(180, 85, 50);
}

/* Success/Check/Done 类型 - 绿色系 */
[data-component="admonition"][data-type="success"],
[data-component="admonition"][data-type="check"],
[data-component="admonition"][data-type="done"] {
  color: rgb(8, 185, 78);
  background-color: rgba(8, 185, 78, 0.1);
  border-left-color: rgb(8, 185, 78);
}

/* Question/Help/FAQ/Warning/Caution/Attention 类型 - 橙色系 */
[data-component="admonition"][data-type="question"],
[data-component="admonition"][data-type="help"],
[data-component="admonition"][data-type="faq"],
[data-component="admonition"][data-type="warning"],
[data-component="admonition"][data-type="caution"],
[data-component="admonition"][data-type="attention"] {
  color: rgb(236, 117, 0);
  background-color: rgba(236, 117, 0, 0.1);
  border-left-color: rgb(236, 117, 0);
}

/* Failure/Fail/Missing/Danger/Error/Bug 类型 - 红色系 */
[data-component="admonition"][data-type="failure"],
[data-component="admonition"][data-type="fail"],
[data-component="admonition"][data-type="missing"],
[data-component="admonition"][data-type="danger"],
[data-component="admonition"][data-type="error"],
[data-component="admonition"][data-type="bug"] {
  color: rgb(233, 49, 71);
  background-color: rgba(233, 49, 71, 0.1);
  border-left-color: rgb(233, 49, 71);
}

/* Example 类型 - 紫色系 */
[data-component="admonition"][data-type="example"] {
  color: rgb(120, 82, 238);
  background-color: rgba(120, 82, 238, 0.1);
  border-left-color: rgb(120, 82, 238);
}

/* Quote/Cite 类型 - 灰色系 */
[data-component="admonition"][data-type="quote"],
[data-component="admonition"][data-type="cite"] {
  color: rgb(158, 158, 158);
  background-color: rgba(158, 158, 158, 0.1);
  border-left-color: rgb(158, 158, 158);
}

/* --------------------------------------- */
/* 二级标题优化 - 修复过度样式 */
/* --------------------------------------- */

h2 {
  font-size: 1.5em !important;
  font-weight: 600 !important;
  margin: 1.5em 0 0.75em !important;
  color: #1F2937 !important;
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
  display: block !important;
}

/* Anthropic Style 主题 - H2 特定样式 */
#render-container h2 {
  font-size: 1.3em !important;
  text-align: center !important;
  margin: 3em auto 2em !important;
  display: table !important;
  padding: 0.5em 1em !important;
  background: rgb(200, 100, 66) !important;
  color: rgb(255, 255, 255) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 8px rgba(200, 100, 66, 0.15) !important;
}

#render-container h2 .content {
  color: rgb(255, 255, 255) !important;
  background: transparent !important;
}

/* 编号前缀样式 */
h2 .prefix {
  display: inline-block;
  margin-right: 0.5em;
  color: #9CA3AF;
  font-weight: normal;
  font-size: 0.9em;
}

/* 标题内容 */
h2 .content {
  display: inline;
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
}

/* Blockquote 与 Admonition 区分 */
blockquote:not([data-component="admonition"]) {
  border-left: 3px solid #E5E7EB;
  background: #F9FAFB;
  padding: 0.75em 1em;
  margin: 1em 0;
  border-radius: 4px;
  font-style: italic;
  color: #6B7280;
}

/* Anthropic Style 主题 - Blockquote */
#render-container blockquote:not([data-component="admonition"]) {
  border-left: 4px solid rgb(200, 100, 66);
  background: rgba(200, 100, 66, 0.05);
  padding: 1em;
  margin: 1.5em 0.5em;
  border-radius: 6px;
  font-style: italic;
  color: rgb(63, 63, 63);
}

/* --------------------------------------- */
/* math */
/* --------------------------------------- */
.block-math-svg {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin:20px 0px;
  max-width: 300% !important;
}

/* --------------------------------------- */
/* 高亮 */
/* --------------------------------------- */
.note-highlight {
  background-color: rgba(255,208,0, 0.4);
}

/* --------------------------------------- */
/* 列表需要强制设置样式*/
/* --------------------------------------- */
ul {
  list-style-type: disc;
}

.note-svg-icon {
  min-width: 24px;
  height: 24px;
  display: inline-block;
}

.note-svg-icon svg {
  width: 100%;
  height: 100%;
}

.note-embed-excalidraw-left {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
}

.note-embed-excalidraw-center {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

.note-embed-excalidraw-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
}

.note-embed-excalidraw {

}
`;
