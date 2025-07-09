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
import { Package, History, Settings, LogOut, User, Building2, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-sm">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur opacity-20 -z-10"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">RegisFlow</h1>
                <p className="text-sm text-muted-foreground">Registre des ventes des Feux d'artifice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Store Selector for Admin */}
              {isAdmin && !isLoadingStores && (
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-border/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={selectedStoreId?.toString() || ""} 
                    onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                  >
                    <SelectTrigger className="w-48 border-0 bg-transparent focus:ring-0">
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
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedStore.name}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className="flex items-center gap-1">
                    {user?.role === 'admin' && <Shield className="h-3 w-3 text-primary" />}
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive smooth-transition"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedStore && (
          <div className="mb-8 slide-in-up">
            <Card className="modern-card-elevated overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 -z-10"></div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{selectedStore.name}</h2>
                    <div className="space-y-1">
                      {selectedStore.address && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center">📍</span>
                          {selectedStore.address}
                        </p>
                      )}
                      <div className="flex gap-6 text-sm">
                        {selectedStore.phone && (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center">📞</span>
                            {selectedStore.phone}
                          </span>
                        )}
                        {selectedStore.email && (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center">✉️</span>
                            {selectedStore.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className={`grid w-full ${canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'} max-w-2xl h-14 bg-muted/50 p-2 rounded-2xl border border-border/50`}>
              <TabsTrigger 
                value="new-sale" 
                className="h-10 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium"
              >
                <Package className="h-5 w-5 mr-2" />
                Nouvelle Vente
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="h-10 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium"
              >
                <History className="h-5 w-5 mr-2" />
                Historique
              </TabsTrigger>
              {canAccessAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="h-10 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Administration
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="new-sale" className="mt-8">
              <div className="slide-in-up">
                <NewSaleForm />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <div className="slide-in-up">
                <SalesHistory canDelete={canDeleteSales} />
              </div>
            </TabsContent>

            {canAccessAdmin && (
              <TabsContent value="admin" className="mt-8">
                <div className="slide-in-up">
                  <Administration />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
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