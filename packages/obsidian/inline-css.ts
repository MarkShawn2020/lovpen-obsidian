// 需要渲染进inline style的css样式
// 注意：这里只放布局/结构样式，所有视觉样式（颜色/背景/边框色/阴影/圆角）由各主题CSS控制
export default `
/* --------------------------------------- */
/* Admonition 组件 - 仅布局结构 */
/* --------------------------------------- */

[data-component="admonition"] {
  padding: 1.25em 1.5em;
  display: flex;
  flex-direction: column;
  margin: 1.5em 0;
  position: relative;
}

[data-element="admonition-header"] {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: 600;
  margin-bottom: 0.75em;
}

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

[data-element="admonition-title"] {
  flex: 1;
  line-height: 1.4;
}

[data-element="admonition-content"] {
  line-height: 1.7;
  padding-left: calc(24px + 0.75em);
}

[data-element="admonition-content"] > *:first-child {
  margin-top: 0;
}

[data-element="admonition-content"] > *:last-child {
  margin-bottom: 0;
}

/* 编号前缀样式 */
h2 .prefix {
  display: inline-block;
  margin-right: 0.5em;
  font-weight: normal;
  font-size: 0.9em;
}

/* 标题内容 */
h2 .content {
  display: inline;
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
  margin: 20px 0px;
  max-width: 300% !important;
}

/* --------------------------------------- */
/* 高亮 */
/* --------------------------------------- */
.note-highlight {
  background-color: rgba(255,208,0, 0.4);
}

/* --------------------------------------- */
/* 列表需要强制设置样式 */
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
`;
