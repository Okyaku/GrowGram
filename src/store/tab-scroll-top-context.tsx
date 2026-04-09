import React, { createContext, useContext, useMemo, useRef } from "react";

type ScrollToTopHandler = () => void;

type TabScrollTopContextType = {
  registerScrollToTop: (tabName: string, handler: ScrollToTopHandler | null) => void;
  scrollToTop: (tabName: string) => void;
};

const TabScrollTopContext = createContext<TabScrollTopContextType | null>(null);

export const TabScrollTopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlersRef = useRef<Record<string, ScrollToTopHandler | undefined>>({});

  const value = useMemo<TabScrollTopContextType>(
    () => ({
      registerScrollToTop: (tabName, handler) => {
        if (handler) {
          handlersRef.current[tabName] = handler;
          return;
        }
        delete handlersRef.current[tabName];
      },
      scrollToTop: (tabName) => {
        handlersRef.current[tabName]?.();
      },
    }),
    [],
  );

  return <TabScrollTopContext.Provider value={value}>{children}</TabScrollTopContext.Provider>;
};

export const useTabScrollTop = () => {
  const context = useContext(TabScrollTopContext);
  if (!context) {
    throw new Error("useTabScrollTop must be used inside TabScrollTopProvider");
  }
  return context;
};