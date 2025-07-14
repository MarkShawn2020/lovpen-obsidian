'use client';

import React, { createContext, use, useMemo, useState } from 'react';
import { cn } from '@/utils/Helpers';

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = use(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

type TabsProps = {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
};

type TabsListProps = {
  className?: string;
  children: React.ReactNode;
};

type TabsTriggerProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

type TabsContentProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

const Tabs = ({ ref, defaultValue, className, children }: TabsProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab,
  }), [activeTab]);

  return (
    <TabsContext value={contextValue}>
      <div ref={ref} className={cn('', className)}>
        {children}
      </div>
    </TabsContext>
  );
};

const TabsList = ({ ref, className, children }: TabsListProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex space-x-2 border-b border-border-default',
        className,
      )}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ ref, value, className, children }: TabsTriggerProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      ref={ref}
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2 font-medium text-sm transition-colors border-b-2',
        isActive
          ? 'text-text-main border-primary'
          : 'text-text-faded border-transparent hover:border-gray-300 hover:text-text-main',
        className,
      )}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ ref, value, className, children }: TabsContentProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('mt-4', className)}
    >
      {children}
    </div>
  );
};

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
