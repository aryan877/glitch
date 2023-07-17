import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SidebarContextData {
  flexWidth: number;
  setFlexWidth: React.Dispatch<React.SetStateAction<number>>;
}

const SidebarContext = createContext<SidebarContextData>({
  flexWidth: 200,
  setFlexWidth: () => {},
});

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [flexWidth, setFlexWidth] = useState<number>(200);

  return (
    <SidebarContext.Provider value={{ flexWidth, setFlexWidth }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextData => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
