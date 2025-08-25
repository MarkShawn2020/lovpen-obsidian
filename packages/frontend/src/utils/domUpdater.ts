/**
 * DOM直接更新器
 * 绕过React的渲染机制，直接更新文章内容
 * 这样可以避免滚动位置重置
 */
class DOMUpdater {
  private static instance: DOMUpdater;
  private articleContainer: HTMLElement | null = null;
  private styleElement: HTMLStyleElement | null = null;
  
  static getInstance(): DOMUpdater {
    if (!DOMUpdater.instance) {
      DOMUpdater.instance = new DOMUpdater();
    }
    return DOMUpdater.instance;
  }
  
  /**
   * 设置文章容器引用
   */
  setArticleContainer(container: HTMLElement | null) {
    this.articleContainer = container;
  }
  
  /**
   * 设置样式元素引用
   */
  setStyleElement(element: HTMLStyleElement | null) {
    this.styleElement = element;
  }
  
  /**
   * 检查是否已准备好（容器已注册）
   */
  isReady(): boolean {
    return this.articleContainer !== null;
  }
  
  /**
   * 直接更新文章HTML内容
   * 不触发React重新渲染
   */
  updateArticleHTML(html: string) {
    if (this.articleContainer) {
      // 保存滚动位置
      const scrollTop = this.articleContainer.scrollTop;
      // 直接更新DOM
      this.articleContainer.innerHTML = html;
      // 恢复滚动位置
      this.articleContainer.scrollTop = scrollTop;
    }
  }
  
  /**
   * 直接更新CSS内容
   */
  updateCSS(css: string) {
    if (this.styleElement) {
      this.styleElement.textContent = css;
    }
  }
  
  /**
   * 清理引用
   */
  cleanup() {
    this.articleContainer = null;
    this.styleElement = null;
  }
}

export const domUpdater = DOMUpdater.getInstance();

// 全局暴露给Obsidian插件使用
if (typeof window !== 'undefined') {
  (window as any).__lovpenDOMUpdater = domUpdater;
}