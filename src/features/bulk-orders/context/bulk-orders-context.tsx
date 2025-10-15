import { createContext, useContext, ReactNode } from 'react';

interface BulkOrdersContextType {
  // Add any context values here if needed in the future
}

const BulkOrdersContext = createContext<BulkOrdersContextType | undefined>(undefined);

interface BulkOrdersProviderProps {
  children: ReactNode;
}

export default function BulkOrdersProvider({ children }: BulkOrdersProviderProps) {
  const value: BulkOrdersContextType = {
    // Add any context values here if needed in the future
  };

  return (
    <BulkOrdersContext.Provider value={value}>
      {children}
    </BulkOrdersContext.Provider>
  );
}

export function useBulkOrdersContext() {
  const context = useContext(BulkOrdersContext);
  if (context === undefined) {
    throw new Error('useBulkOrdersContext must be used within a BulkOrdersProvider');
  }
  return context;
}
