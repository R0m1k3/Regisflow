import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { StoreProvider, useStoreContext } from "@/hooks/useStoreContext";
import NewSaleForm from "@/components/NewSaleForm";
import SalesHistory from "@/components/SalesHistory";
import Administration from "@/components/Administration";
import { Package, History, Settings, LogOut, User, Building2, Shield, BarChart3, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

function DashboardContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const { selectedStoreId, setSelectedStoreId, stores, selectedStore, isLoadingStores } = useStoreContext();

  // Fetch sales data for dashboard metrics
  const { data: sales = [] } = useQuery({
    queryKey: ['/api/sales'],
    enabled: !!user
  });

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

  // Calculate dashboard metrics
  const todaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });

  const totalSales = sales.length;
  const todaysCount = todaysSales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.quantite * 25), 0); // Estimation
  const uniqueCustomers = new Set(sales.map(sale => `${sale.nom}_${sale.prenom}`)).size;

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "new-sale", label: "Nouvelle Vente", icon: Package },
    { id: "history", label: "Historique", icon: History },
    ...(canAccessAdmin ? [{ id: "admin", label: "Administration", icon: Settings }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">RegisFlow</h1>
              <p className="text-xs text-gray-500">Feux d'artifice</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Store Selector */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Store Selector for Admin */}
          {isAdmin && !isLoadingStores && (
            <div className="mb-3">
              <Select 
                value={selectedStoreId?.toString() || ""} 
                onValueChange={(value) => setSelectedStoreId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
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
            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{selectedStore.name}</span>
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1">
                {user?.role === 'admin' && <Shield className="h-3 w-3 text-blue-600" />}
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full gap-2 justify-start"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bonjour {user?.firstName} !
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            {selectedStore && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Magasin actuel</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStore.name}</p>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeView === "dashboard" && (
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Commandes du jour</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{todaysCount}</p>
                        <p className="text-sm text-blue-600">+12% vs hier</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Ventes totales</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
                        <p className="text-sm text-green-600">Toutes les ventes</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Clients uniques</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{uniqueCustomers}</p>
                        <p className="text-sm text-purple-600">Base clients</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Revenus estimés</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRevenue.toLocaleString()}€</p>
                        <p className="text-sm text-orange-600">Estimation</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Activités récentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sales.slice(0, 5).map((sale) => (
                        <div key={sale.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {sale.nom} {sale.prenom}
                            </p>
                            <p className="text-sm text-gray-500">{sale.typeArticle} - {sale.quantite} unité(s)</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setActiveView("new-sale")}
                        className="w-full justify-start gap-3 h-12"
                      >
                        <Package className="h-5 w-5" />
                        Nouvelle commande
                      </Button>
                      <Button 
                        onClick={() => setActiveView("history")}
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                      >
                        <History className="h-5 w-5" />
                        Consulter historique
                      </Button>
                      {canAccessAdmin && (
                        <Button 
                          onClick={() => setActiveView("admin")}
                          variant="outline"
                          className="w-full justify-start gap-3 h-12"
                        >
                          <Settings className="h-5 w-5" />
                          Administration
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeView === "new-sale" && (
            <div className="max-w-4xl">
              <NewSaleForm />
            </div>
          )}

          {activeView === "history" && (
            <div>
              <SalesHistory canDelete={canDeleteSales} />
            </div>
          )}

          {activeView === "admin" && canAccessAdmin && (
            <div>
              <Administration />
            </div>
          )}
        </main>
      </div>
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