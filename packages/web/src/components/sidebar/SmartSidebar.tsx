'use client';

import { ReactNode } from 'react';
import { SidebarContext, SidebarMode } from '@/types/sidebar';

interface SmartSidebarProps {
  context: SidebarContext;
  onContextChange: (context: Partial<SidebarContext>) => void;
  children: ReactNode;
}

interface ConditionalSectionProps {
  when: SidebarMode | 'always';
  currentMode: SidebarMode;
  children: ReactNode;
}

function ConditionalSection({ when, currentMode, children }: ConditionalSectionProps) {
  if (when === 'always' || when === currentMode) {
    return <>{children}</>;
  }
  return null;
}

export function SmartSidebar({ context, onContextChange, children }: SmartSidebarProps) {
  const handleModeSwitch = (mode: SidebarMode) => {
    if (mode === 'global') {
      // 切换到全局模式时，清除所有选择
      onContextChange({ mode: 'global', selectedPanels: [] });
    } else {
      onContextChange({ mode });
    }
  };

  return (
    <div className="lg:col-span-3 flex flex-col u-gap-m">
      {/* 上下文指示器 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col u-gap-xs">
            <div className="flex items-center u-gap-xs">
              {context.mode === 'global' && (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">全局设置</span>
                </>
              )}
              {context.mode === 'platform' && context.selectedPanels.length === 1 && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">平台特定</span>
                </>
              )}
              {context.mode === 'multi-select' && context.selectedPanels.length > 1 && (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">批量编辑</span>
                </>
              )}
            </div>
            <div className="text-xs text-text-faded">
              {context.mode === 'global' && '点击预览面板进入平台模式，Ctrl+点击多选'}
              {context.mode === 'platform' && '单平台优化模式，点击背景或「全局」返回'}
              {context.mode === 'multi-select' && '批量操作模式，点击「清除」或背景返回'}
            </div>
          </div>
          
          <div className="flex items-center u-gap-xs">
            <div className="flex items-center u-gap-xs">
              <button
                onClick={() => handleModeSwitch('global')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  context.mode === 'global'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-text-faded hover:text-text-main hover:bg-blue-50'
                }`}
                title="切换到全局模式"
              >
                🌐 全局
              </button>
              {context.selectedPanels.length > 0 && (
                <button
                  onClick={() => handleModeSwitch('global')}
                  className="text-xs px-2 py-1 rounded text-text-faded hover:text-text-main hover:bg-red-50"
                  title="清除选择"
                >
                  ✕ 清除
                </button>
              )}
            </div>
            {context.selectedPanels.length > 0 && (
              <span className="text-xs text-text-faded">
                {context.selectedPanels.length} 个面板
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 动态内容区域 */}
      <div className="flex flex-col u-gap-m">
        {children}
      </div>
    </div>
  );
}

// 导出条件渲染组件供子组件使用
export { ConditionalSection };