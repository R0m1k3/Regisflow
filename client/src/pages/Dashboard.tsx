import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { StoreProvider, useStoreContext } from "@/hooks/useStoreContext";
import NewSaleFormMulti from "@/components/NewSaleFormMulti";
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

  const canAccessAdmin = user?.role === "administrator";
  const canDeleteSales = user?.role === "administrator" || user?.role === "manager";
  const isAdmin = user?.role === "administrator";

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-2 bg-primary text-primary-foreground">
                  <Package className="h-6 w-6" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">RegisFlow</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Registre des ventes des Feux d'artifice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Store Selector for Admin */}
              {isAdmin && !isLoadingStores && (
                <div className="hidden sm:flex items-center gap-3 p-2 bg-muted border border-border">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={selectedStoreId?.toString() || ""} 
                    onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                  >
                    <SelectTrigger className="w-48 border-0 bg-transparent focus:ring-0 text-sm">
                      <SelectValue placeholder="Magasin" />
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
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted border border-border">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedStore.name}</span>
                </div>
              )}

              <div className="flex items-center gap-1 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className="flex items-center gap-1">
                    {user?.role === 'administrator' && <Shield className="h-3 w-3 text-primary" />}
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive smooth-transition touch-friendly-button"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto mobile-padding py-4 sm:py-6 lg:py-8">
        <div className="fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mobile-form-responsive">
            <TabsList className={`grid w-full ${canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'} max-w-full sm:max-w-2xl h-14 bg-muted p-0 border border-border`}>
              <TabsTrigger 
                value="new-sale" 
                className="h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm"
              >
                <Package className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Nouvelle Vente</span>
                <span className="sm:hidden">Vente</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm"
              >
                <History className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Historique</span>
                <span className="sm:hidden">Liste</span>
              </TabsTrigger>
              {canAccessAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="h-full data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium text-sm"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Administration</span>
                  <span className="sm:hidden">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="new-sale" className="mt-8">
              <div className="slide-in-up">
                <NewSaleFormMulti />
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
      isAdmin={user?.role === "administrator"}
    >
      <DashboardContent />
    </StoreProvider>
  );
}