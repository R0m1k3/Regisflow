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
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-purple-600 rounded-lg sm:rounded-xl shadow-sm">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-purple-600 rounded-lg sm:rounded-xl blur opacity-20 -z-10"></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">RegisFlow</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Registre des ventes des Feux d'artifice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Store Selector for Admin */}
              {isAdmin && !isLoadingStores && (
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-muted/50 rounded-lg border border-border/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={selectedStoreId?.toString() || ""} 
                    onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                  >
                    <SelectTrigger className="w-32 sm:w-48 border-0 bg-transparent focus:ring-0 text-sm">
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
                <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-lg border border-border/50">
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
                    {user?.role === 'admin' && <Shield className="h-3 w-3 text-primary" />}
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
        {selectedStore && (
          <div className="mb-6 sm:mb-8 slide-in-up">
            <Card className="modern-card-elevated overflow-hidden">
              <CardContent className="mobile-card-content">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl blur opacity-20 -z-10"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 truncate">{selectedStore.name}</h2>
                    <div className="space-y-1 sm:space-y-2">
                      {selectedStore.address && (
                        <p className="text-muted-foreground flex items-start gap-2 text-sm sm:text-base">
                          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">📍</span>
                          <span className="break-words">{selectedStore.address}</span>
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
                        {selectedStore.phone && (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">📞</span>
                            <span className="break-all">{selectedStore.phone}</span>
                          </span>
                        )}
                        {selectedStore.email && (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">✉️</span>
                            <span className="break-all">{selectedStore.email}</span>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mobile-form-responsive">
            <TabsList className={`grid w-full ${canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'} max-w-full sm:max-w-2xl h-12 sm:h-14 bg-muted/50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-border/50`}>
              <TabsTrigger 
                value="new-sale" 
                className="h-9 sm:h-10 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium text-xs sm:text-sm"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nouvelle Vente</span>
                <span className="sm:hidden">Vente</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="h-9 sm:h-10 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium text-xs sm:text-sm"
              >
                <History className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Historique</span>
                <span className="sm:hidden">Liste</span>
              </TabsTrigger>
              {canAccessAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="h-9 sm:h-10 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md smooth-transition font-medium text-xs sm:text-sm"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Administration</span>
                  <span className="sm:hidden">Admin</span>
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