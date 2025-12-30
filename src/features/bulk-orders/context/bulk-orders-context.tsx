import { createContext, useContext, ReactNode } from 'react'

type BulkOrdersContextType = Record<string, never>

const BulkOrdersContext = createContext<BulkOrdersContextType | undefined>(
  undefined
)

interface BulkOrdersProviderProps {
  children: ReactNode
}

export default function BulkOrdersProvider({
  children,
}: BulkOrdersProviderProps) {
  const value: BulkOrdersContextType = {}

  return (
    <BulkOrdersContext.Provider value={value}>
      {children}
    </BulkOrdersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBulkOrdersContext() {
  const context = useContext(BulkOrdersContext)
  if (context === undefined) {
    throw new Error(
      'useBulkOrdersContext must be used within a BulkOrdersProvider'
    )
  }
  return context
}
