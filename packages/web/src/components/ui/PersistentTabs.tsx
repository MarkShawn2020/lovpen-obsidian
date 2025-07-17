'use client';

import React, { createContext, use, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/Helpers';
import { usePersistentState } from '@/components/providers/ReactQueryProvider';

// Types for persistent tabs
interface TabState {
  activeTab: string;
  tabHistory: string[];
  lastAccessed: Record<string, number>;
}

interface PersistentTabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  tabHistory: string[];
  getTabAccessTime: (tabId: string) => number;
  isTabRecentlyAccessed: (tabId: string, withinMinutes?: number) => boolean;
}

const PersistentTabsContext = createContext<PersistentTabsContextValue | undefined>(undefined);

const usePersistentTabsContext = () => {
  const context = use(PersistentTabsContext);
  if (!context) {
    throw new Error('Persistent tabs components must be used within a PersistentTabs provider');
  }
  return context;
};

// Custom hook for tab state persistence
function useInternalTabState(tabsId: string, defaultValue: string) {
  const queryClient = useQueryClient();
  const storageKey = `tabs_${tabsId}`;
  
  // Use React Query to manage tab state with persistence
  const { data: tabState, isLoading } = useQuery({
    queryKey: ['tabState', tabsId],
    queryFn: async (): Promise<TabState> => {
      // Try to get from localStorage first
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return {
              activeTab: parsed.activeTab || defaultValue,
              tabHistory: parsed.tabHistory || [defaultValue],
              lastAccessed: parsed.lastAccessed || { [defaultValue]: Date.now() },
            };
          } catch (error) {
            console.error('Failed to parse saved tab state:', error);
          }
        }
      }
      
      // Return default state
      return {
        activeTab: defaultValue,
        tabHistory: [defaultValue],
        lastAccessed: { [defaultValue]: Date.now() },
      };
    },
    staleTime: Infinity, // Never consider stale
    gcTime: Infinity, // Never garbage collect
  });

  const updateTabState = (newState: Partial<TabState>) => {
    const currentState = tabState || {
      activeTab: defaultValue,
      tabHistory: [defaultValue],
      lastAccessed: { [defaultValue]: Date.now() },
    };
    
    const updatedState = { ...currentState, ...newState };
    
    // Update React Query cache
    queryClient.setQueryData(['tabState', tabsId], updatedState);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
    }
  };

  const setActiveTab = (tabId: string) => {
    const currentState = tabState || {
      activeTab: defaultValue,
      tabHistory: [defaultValue],
      lastAccessed: { [defaultValue]: Date.now() },
    };
    
    const newHistory = [tabId, ...currentState.tabHistory.filter(id => id !== tabId)].slice(0, 10);
    const newLastAccessed = {
      ...currentState.lastAccessed,
      [tabId]: Date.now(),
    };
    
    updateTabState({
      activeTab: tabId,
      tabHistory: newHistory,
      lastAccessed: newLastAccessed,
    });
  };

  const getTabAccessTime = (tabId: string) => {
    return tabState?.lastAccessed[tabId] || 0;
  };

  const isTabRecentlyAccessed = (tabId: string, withinMinutes = 30) => {
    const accessTime = getTabAccessTime(tabId);
    return accessTime > 0 && (Date.now() - accessTime) < (withinMinutes * 60 * 1000);
  };

  return {
    activeTab: tabState?.activeTab || defaultValue,
    tabHistory: tabState?.tabHistory || [defaultValue],
    setActiveTab,
    getTabAccessTime,
    isTabRecentlyAccessed,
    isLoaded: !isLoading,
  };
}

// Enhanced Tabs component with persistence
interface PersistentTabsProps {
  id: string; // Unique identifier for persistence
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
  onTabChange?: (tabId: string) => void;
  restoreOnMount?: boolean;
}

interface PersistentTabsListProps {
  className?: string;
  children: React.ReactNode;
  showHistory?: boolean;
  historyLimit?: number;
}

interface PersistentTabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface PersistentTabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  lazy?: boolean;
}

const PersistentTabs = ({ 
  id, 
  defaultValue, 
  className, 
  children, 
  onTabChange,
  restoreOnMount: _restoreOnMount = true,
  ref 
}: PersistentTabsProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const tabState = useInternalTabState(id, defaultValue);
  
  useEffect(() => {
    if (tabState.isLoaded && onTabChange) {
      onTabChange(tabState.activeTab);
    }
  }, [tabState.activeTab, tabState.isLoaded, onTabChange]);

  const contextValue = useMemo(() => ({
    activeTab: tabState.activeTab,
    setActiveTab: tabState.setActiveTab,
    tabHistory: tabState.tabHistory,
    getTabAccessTime: tabState.getTabAccessTime,
    isTabRecentlyAccessed: tabState.isTabRecentlyAccessed,
  }), [tabState]);

  if (!tabState.isLoaded) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <PersistentTabsContext value={contextValue}>
      <div ref={ref} className={cn('persistent-tabs', className)}>
        {children}
      </div>
    </PersistentTabsContext>
  );
};

const PersistentTabsList = ({ 
  className, 
  children, 
  showHistory = false, 
  historyLimit = 5,
  ref 
}: PersistentTabsListProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { tabHistory } = usePersistentTabsContext();
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex space-x-2 border-b border-border-default',
        className,
      )}
    >
      {children}
      {showHistory && tabHistory.length > 1 && (
        <div className="flex items-center space-x-1 ml-4 text-xs text-gray-500">
          <span>Recent:</span>
          {tabHistory.slice(1, historyLimit + 1).map((tabId) => (
            <span key={tabId} className="px-2 py-1 bg-gray-100 rounded">
              {tabId}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const PersistentTabsTrigger = ({ 
  value, 
  className, 
  children, 
  badge,
  disabled = false,
  ref 
}: PersistentTabsTriggerProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const { activeTab, setActiveTab, isTabRecentlyAccessed } = usePersistentTabsContext();
  const isActive = activeTab === value;
  const isRecent = isTabRecentlyAccessed(value);

  return (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(
        'relative px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center space-x-2',
        isActive
          ? 'text-text-main border-primary'
          : 'text-text-faded border-transparent hover:border-gray-300 hover:text-text-main',
        isRecent && !isActive && 'bg-blue-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span>{children}</span>
      {badge && <span className="ml-2">{badge}</span>}
      {isRecent && !isActive && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </button>
  );
};

const PersistentTabsContent = ({ 
  value, 
  className, 
  children, 
  lazy = false,
  ref 
}: PersistentTabsContentProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { activeTab, getTabAccessTime } = usePersistentTabsContext();
  const isActive = activeTab === value;
  const hasBeenAccessed = getTabAccessTime(value) > 0;

  // If lazy loading is enabled and tab hasn't been accessed, don't render content
  if (lazy && !hasBeenAccessed) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'mt-4 persistent-tab-content',
        !isActive && 'hidden',
        className,
      )}
      data-tab-id={value}
      data-active={isActive}
    >
      {children}
    </div>
  );
};

// Additional utility component for tab analytics
const TabAnalytics = ({ tabId }: { tabId: string }) => {
  const { getTabAccessTime, isTabRecentlyAccessed } = usePersistentTabsContext();
  const accessTime = getTabAccessTime(tabId);
  const isRecent = isTabRecentlyAccessed(tabId);

  if (accessTime === 0) return null;

  return (
    <div className="text-xs text-gray-500">
      Last accessed: {new Date(accessTime).toLocaleString()}
      {isRecent && <span className="ml-2 text-blue-500">• Recent</span>}
    </div>
  );
};

// Export components
PersistentTabs.displayName = 'PersistentTabs';
PersistentTabsList.displayName = 'PersistentTabsList';
PersistentTabsTrigger.displayName = 'PersistentTabsTrigger';
PersistentTabsContent.displayName = 'PersistentTabsContent';
TabAnalytics.displayName = 'TabAnalytics';

export { 
  PersistentTabs, 
  PersistentTabsContent, 
  PersistentTabsList, 
  PersistentTabsTrigger,
  TabAnalytics,
  usePersistentTabsContext 
};

// Hook for external tab state management
export function useTabState(tabsId: string, defaultValue: string) {
  const [state, setState, isLoaded] = usePersistentState<TabState>(
    `tabs_${tabsId}`,
    {
      activeTab: defaultValue,
      tabHistory: [defaultValue],
      lastAccessed: { [defaultValue]: Date.now() },
    }
  );

  const setActiveTab = (tabId: string) => {
    const newHistory = [tabId, ...state.tabHistory.filter(id => id !== tabId)].slice(0, 10);
    const newLastAccessed = {
      ...state.lastAccessed,
      [tabId]: Date.now(),
    };
    
    setState({
      activeTab: tabId,
      tabHistory: newHistory,
      lastAccessed: newLastAccessed,
    });
  };

  return {
    activeTab: state.activeTab,
    setActiveTab,
    tabHistory: state.tabHistory,
    isLoaded,
  };
}