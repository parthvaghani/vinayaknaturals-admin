import { createContext, useContext, type ReactNode } from 'react'

// Use object instead of empty interface to resolve lint error
type PartnershipRequestsContextType = object

const PartnershipRequestsContext = createContext<
  PartnershipRequestsContextType | undefined
>(undefined)

export function PartnershipRequestsProvider({
  children,
}: {
  children: ReactNode
}) {
  const value: PartnershipRequestsContextType = {
    // Add any context values needed for partnership requests
  }

  return (
    <PartnershipRequestsContext.Provider value={value}>
      {children}
    </PartnershipRequestsContext.Provider>
  )
}

export function usePartnershipRequestsContext() {
  const context = useContext(PartnershipRequestsContext)
  if (context === undefined) {
    throw new Error(
      'usePartnershipRequestsContext must be used within a PartnershipRequestsProvider'
    )
  }
  return context
}

export default PartnershipRequestsProvider
