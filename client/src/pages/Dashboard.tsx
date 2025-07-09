import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { StoreProvider, useStoreContext } from "@/hooks/useStoreContext";
import NewSaleForm from "@/components/NewSaleForm";
import SalesHistory from "@/components/SalesHistory";
import Administration from "@/components/Administration";
import { Package, History, Settings, LogOut, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function DashboardContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new-sale");
  const { selectedStoreId, setSelectedStoreId, stores, selectedStore, isLoadingStores } = useStoreContext();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const canAccessAdmin = user?.role === "admin";
  const canDeleteSales = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Registre des Ventes</h1>
                <p className="text-sm text-gray-500">Gestion des feux d'artifice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Store Selector for Admin */}
              {isAdmin && !isLoadingStores && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <Select 
                    value={selectedStoreId?.toString() || ""} 
                    onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sélectionner un magasin" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Current Store Display for Non-Admin */}
              {!isAdmin && selectedStore && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedStore.name}</span>
                </div>
              )}

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedStore && (
          <div className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedStore.name}</h2>
                    <div className="text-sm text-gray-600">
                      {selectedStore.address && <p>{selectedStore.address}</p>}
                      <div className="flex gap-4">
                        {selectedStore.phone && <span>📞 {selectedStore.phone}</span>}
                        {selectedStore.email && <span>✉️ {selectedStore.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-auto">
            <TabsTrigger value="new-sale" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Nouvelle Vente
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            {canAccessAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Administration
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="new-sale">
            <NewSaleForm />
          </TabsContent>

          <TabsContent value="history">
            <SalesHistory canDelete={canDeleteSales} />
          </TabsContent>

          {canAccessAdmin && (
            <TabsContent value="admin">
              <Administration />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <StoreProvider 
      userStoreId={user?.storeId} 
      isAdmin={user?.role === "admin"}
    >
      <DashboardContent />
    </StoreProvider>
  );
}