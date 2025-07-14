'use client';

import type {
  DragEndEvent,
} from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

type PreviewPanel = {
  id: string;
  platform: string;
  title: string;
  isSelected?: boolean;
};

type Platform = {
  name: string;
  fullName: string;
  color: string;
};

type PreviewSectionProps = {
  previewPanels: PreviewPanel[];
  platforms: Record<string, Platform>;
  generatedContent: string;
  addPreviewPanel: (platform: string) => void;
  removePreviewPanel: (panelId: string) => void;
  reorderPreviewPanels: (panels: PreviewPanel[]) => void;
  onPanelSelect: (panelId: string, isCtrlClick?: boolean) => void;
  onBackgroundClick: () => void;
};

// 可拖拽的预览面板组件
function DraggablePreviewPanel({
  panel,
  platforms,
  generatedContent,
  removePreviewPanel,
  previewPanelsLength,
  onPanelSelect,
}: {
  panel: PreviewPanel;
  platforms: Record<string, Platform>;
  generatedContent: string;
  removePreviewPanel: (panelId: string) => void;
  previewPanelsLength: number;
  onPanelSelect: (panelId: string, isCtrlClick?: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为
    e.preventDefault();
    e.stopPropagation();

    // 阻止点击拖拽句柄时触发选择
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }

    // 阻止点击按钮时触发选择
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    onPanelSelect(panel.id, e.ctrlKey || e.metaKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPanelSelect(panel.id, e.ctrlKey || e.metaKey);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handlePanelClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Select preview panel for ${panel.title}`}
      className={`bg-background-main rounded-lg border overflow-hidden flex flex-col min-h-[400px] transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'opacity-50 shadow-xl scale-105 border-primary/40'
          : panel.isSelected
            ? 'border-primary/60 shadow-md ring-2 ring-primary/20'
            : 'border-border-default/20 shadow-sm hover:shadow-md hover:border-primary/30'
      }`}
    >
      {/* 单个预览面板工具栏 */}
      <div className="bg-background-ivory-medium px-6 py-3 border-b border-border-default/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center u-gap-s">
            {/* 拖拽句柄 */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              data-drag-handle
              className="text-text-faded hover:text-text-main transition-all duration-200 cursor-grab active:cursor-grabbing p-1 hover:bg-background-oat rounded-sm"
              title="拖拽排序"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-current"
              >
                <circle cx="2" cy="2" r="1" fill="currentColor" />
                <circle cx="6" cy="2" r="1" fill="currentColor" />
                <circle cx="10" cy="2" r="1" fill="currentColor" />
                <circle cx="2" cy="6" r="1" fill="currentColor" />
                <circle cx="6" cy="6" r="1" fill="currentColor" />
                <circle cx="10" cy="6" r="1" fill="currentColor" />
                <circle cx="2" cy="10" r="1" fill="currentColor" />
                <circle cx="6" cy="10" r="1" fill="currentColor" />
                <circle cx="10" cy="10" r="1" fill="currentColor" />
              </svg>
            </button>
            <div className={`w-3 h-3 rounded-full ${platforms[panel.platform]?.color}`}></div>
            <h3 className="font-medium text-text-main text-sm">{panel.title}</h3>
            {panel.isSelected && (
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                ✓
              </div>
            )}
          </div>

          <div className="flex items-center u-gap-s">
            {/* 面板操作按钮 */}
            <button
              type="button"
              className="text-xs text-text-faded hover:text-text-main transition-colors"
              title="设置"
            >
              ⚙️
            </button>

            {previewPanelsLength > 1 && (
              <button
                type="button"
                onClick={() => removePreviewPanel(panel.id)}
                className="text-xs text-text-faded hover:text-red-500 transition-colors"
                title="移除"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 单个预览内容区 */}
      <div className="flex-1 p-6">
        {generatedContent
          ? (
              <div className="bg-background-ivory-medium rounded-md border border-border-default/20 p-6">
                <pre className="whitespace-pre-wrap font-sans text-text-main leading-relaxed text-sm">
                  {generatedContent}
                </pre>
              </div>
            )
          : (
              <div className="h-full flex items-center justify-center text-text-faded">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-sm">等待内容生成</p>
                </div>
              </div>
            )}
      </div>

      {/* 单个面板底部操作栏 */}
      {generatedContent && (
        <div className="border-t border-border-default/20 p-4 bg-background-ivory-medium">
          <div className="flex items-center justify-between">
            <div className="flex items-center u-gap-l text-xs text-text-faded">
              <span>
                字数:
                {generatedContent.length}
              </span>
              <span>预计阅读: 2分钟</span>
            </div>
            <div className="flex items-center u-gap-s">
              <Button variant="outline" size="sm" className="text-xs">
                重新生成
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                编辑
              </Button>
              <Button variant="primary" size="sm" className="text-xs">
                发布到
                {platforms[panel.platform]?.name}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PreviewSection({
  previewPanels,
  platforms,
  generatedContent,
  addPreviewPanel,
  removePreviewPanel,
  reorderPreviewPanels,
  onPanelSelect,
  onBackgroundClick,
}: PreviewSectionProps) {
  const [selectValue, setSelectValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 设置激活距离，避免点击事件被拦截
      activationConstraint: {
        distance: 8, // 需要拖拽8px才激活拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddPanel = (platform: string) => {
    addPreviewPanel(platform);
    setSelectValue(''); // 重置选择器
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = previewPanels.findIndex(panel => panel.id === active.id);
      const newIndex = previewPanels.findIndex(panel => panel.id === over?.id);

      const newPanels = arrayMove(previewPanels, oldIndex, newIndex);
      reorderPreviewPanels(newPanels);
    }
  };

  return (
    <div 
      className="lg:col-span-6 flex flex-col u-gap-m" 
      onClick={onBackgroundClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onBackgroundClick();
        }
      }}
      role="region"
      tabIndex={0}
      aria-label="Preview section background"
    >
      {/* 全局工具栏 */}
      <div
        className="bg-background-main rounded-lg border border-border-default/20 px-6 py-4"
        onClick={e => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="toolbar"
        aria-label="Preview section toolbar"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center u-gap-s">
            <h2 className="font-medium text-text-main">内容预览区</h2>
            <div className="flex items-center u-gap-s">
              {previewPanels.length > 1 && (
                <span className="text-xs text-text-faded bg-background-oat px-2 py-1 rounded">
                  拖拽排序
                </span>
              )}
              {previewPanels.filter(p => p.isSelected).length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  已选
                  {' '}
                  {previewPanels.filter(p => p.isSelected).length}
                  {' '}
                  个
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center u-gap-s">
            {/* 添加预览面板选择器 */}
            <Select
              value={selectValue}
              onValueChange={handleAddPanel}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="+ 添加预览面板" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(platforms).map(([id, platform]) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex items-center u-gap-s">
                      <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                      <span>{platform.fullName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 可拖拽的预览面板列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 u-gap-m flex flex-col overflow-auto">
          <SortableContext
            items={previewPanels.map(panel => panel.id)}
            strategy={verticalListSortingStrategy}
          >
            {previewPanels.length === 0
              ? (
                  <div className="h-full flex items-center justify-center text-text-faded">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <p className="text-lg font-medium mb-2">还没有预览面板</p>
                      <p className="text-sm">点击上方「+ 添加预览面板」开始</p>
                    </div>
                  </div>
                )
              : (
                  previewPanels.map(panel => (
                    <DraggablePreviewPanel
                      key={panel.id}
                      panel={panel}
                      platforms={platforms}
                      generatedContent={generatedContent}
                      removePreviewPanel={removePreviewPanel}
                      previewPanelsLength={previewPanels.length}
                      onPanelSelect={onPanelSelect}
                    />
                  ))
                )}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
