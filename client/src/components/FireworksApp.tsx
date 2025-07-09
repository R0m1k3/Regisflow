import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Flame, Plus, History } from 'lucide-react';
import NewSaleForm from './NewSaleForm';
import SalesHistory from './SalesHistory';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { apiRequest } from '@/lib/queryClient';
import type { Sale } from '@shared/schema';

export default function FireworksApp() {
  const [activeTab, setActiveTab] = useState('nouvelle-vente');
  const { user } = useAuth();
  const { selectedStoreId } = useStoreContext();

  // Query for sales count
  const { data: salesData } = useQuery<Sale[]>({
    queryKey: ['/api/sales', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      const params = new URLSearchParams();
      params.append('storeId', selectedStoreId.toString());
      const response = await apiRequest(`/api/sales?${params.toString()}`);
      return response.json();
    },
    enabled: !!selectedStoreId && !!user,
    refetchOnWindowFocus: false,
  });

  const sales = Array.isArray(salesData) ? salesData : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Flame className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                RegisFlow
              </h1>
              <span className="text-sm text-gray-500">
                Registre des ventes de Feux d'artifice
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Conforme à la réglementation française
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="nouvelle-vente" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Vente
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique ({sales.length} vente{sales.length !== 1 ? 's' : ''})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nouvelle-vente">
            <NewSaleForm />
          </TabsContent>

          <TabsContent value="historique">
            <SalesHistory canDelete={user?.role === 'admin'} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
