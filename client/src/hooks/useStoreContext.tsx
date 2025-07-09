import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Store } from '@shared/schema';

interface StoreContextType {
  selectedStoreId: number | null;
  setSelectedStoreId: (storeId: number | null) => void;
  stores: Store[];
  selectedStore: Store | null;
  isLoadingStores: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  userStoreId?: number | null;
  isAdmin?: boolean;
}

export function StoreProvider({ children, userStoreId, isAdmin }: StoreProviderProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Query all stores for admin, or just get user's store for non-admin
  const { data: stores = [], isLoading: isLoadingStores } = useQuery<Store[]>({
    queryKey: isAdmin ? ['/api/admin/stores'] : ['/api/stores'],
    queryFn: async () => {
      const endpoint = isAdmin ? '/api/admin/stores' : '/api/stores';
      const response = await apiRequest(endpoint);
      return response.json();
    },
    enabled: !!isAdmin || !!userStoreId,
  });

  // Set initial selected store
  useEffect(() => {
    if (stores.length > 0 && selectedStoreId === null) {
      if (isAdmin) {
        // Admin: select first store by default
        setSelectedStoreId(stores[0].id);
      } else if (userStoreId) {
        // Non-admin: select user's store
        setSelectedStoreId(userStoreId);
      }
    }
  }, [stores, selectedStoreId, isAdmin, userStoreId]);

  const selectedStore = stores.find(store => store.id === selectedStoreId) || null;

  return (
    <StoreContext.Provider value={{
      selectedStoreId,
      setSelectedStoreId,
      stores,
      selectedStore,
      isLoadingStores,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
}