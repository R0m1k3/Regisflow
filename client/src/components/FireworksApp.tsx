import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Flame } from 'lucide-react';
import NewSaleForm from './NewSaleForm';
import SalesHistory from './SalesHistory';
import { useIndexedDB } from '@/hooks/useIndexedDB';

export default function FireworksApp() {
  const [activeTab, setActiveTab] = useState('nouvelle-vente');
  const { sales, isLoading, error, saveSale, deleteSale } = useIndexedDB();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Flame className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Registre des Ventes de Pétards
              </h1>
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle Vente
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historique ({sales.length} vente{sales.length !== 1 ? 's' : ''})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nouvelle-vente">
            <NewSaleForm onSaveSale={saveSale} />
          </TabsContent>

          <TabsContent value="historique">
            <SalesHistory 
              sales={sales}
              isLoading={isLoading}
              error={error}
              onDeleteSale={deleteSale}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
