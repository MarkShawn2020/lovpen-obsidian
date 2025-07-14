'use client';

import type { ReactNode } from 'react';
import type { SidebarContext, SidebarMode } from '@/types/sidebar';

type SmartSidebarProps = {
  context: SidebarContext;
  onContextChange: (context: Partial<SidebarContext>) => void;
  children: ReactNode;
};

type ConditionalSectionProps = {
  when: SidebarMode | 'always';
  currentMode: SidebarMode;
  children: ReactNode;
};

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
      {/* 动态标题指示器 */}
      <div className="bg-background-main rounded-lg border border-border-default/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col u-gap-xs">
            <div className="flex items-center u-gap-xs">
              {context.mode === 'global' && (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">创作设置</span>
                </>
              )}
              {context.mode === 'platform' && context.selectedPanels.length === 1 && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">专门设置</span>
                </>
              )}
              {context.mode === 'multi-select' && context.selectedPanels.length > 1 && (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-text-main">统一调整</span>
                </>
              )}
            </div>
            <div className="text-xs text-text-faded whitespace-nowrap overflow-hidden text-ellipsis">
              {context.mode === 'global' && '点击面板进行专门设置'}
              {context.mode === 'platform' && '专为此平台优化设置'}
              {context.mode === 'multi-select' && `同时调整 ${context.selectedPanels.length} 个平台`}
            </div>
          </div>

          <div className="flex items-center u-gap-xs">
            {context.selectedPanels.length > 0 && (
              <div className="flex items-center u-gap-xs">
                <button
                  onClick={() => handleModeSwitch('global')}
                  className="text-xs px-2 py-1 rounded text-text-faded hover:text-text-main hover:bg-gray-50 transition-colors"
                  title="返回通用设置"
                >
                  ← 返回
                </button>
                <span className="text-xs text-text-faded">
                  {context.selectedPanels.length}
                  {' '}
                  个平台
                </span>
              </div>
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
