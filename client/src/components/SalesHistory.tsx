import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import type { Sale } from '@shared/schema';
import { History, Download, Trash2, Eye, Filter, FileText, Search, X, Calendar, Users } from 'lucide-react';
import SaleDetailsModal from '@/components/SaleDetailsModal';

interface SalesHistoryProps {
  canDelete?: boolean;
}

export default function SalesHistory({ canDelete = false }: SalesHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedStoreId } = useStoreContext();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Query for sales
  const { data: salesData, isLoading } = useQuery<Sale[]>({
    queryKey: ['/api/sales', startDate, endDate, selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (selectedStoreId) {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const queryString = params.toString();
      const response = await apiRequest(`/api/sales${queryString ? `?${queryString}` : ''}`);
      return response.json();
    },
    enabled: !!selectedStoreId && !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const sales = Array.isArray(salesData) ? salesData : [];

  // Filtrer les ventes selon la recherche
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    
    const query = searchQuery.toLowerCase().trim();
    return sales.filter(sale => 
      sale.nom.toLowerCase().includes(query) ||
      sale.prenom.toLowerCase().includes(query) ||
      sale.vendeur.toLowerCase().includes(query) ||
      sale.typeArticle.toLowerCase().includes(query) ||
      sale.gencode.includes(query) ||
      sale.numeroIdentite.toLowerCase().includes(query) ||
      (sale.lieuNaissance && sale.lieuNaissance.toLowerCase().includes(query)) ||
      sale.modePaiement.toLowerCase().includes(query)
    );
  }, [sales, searchQuery]);

  // Delete mutation
  const deleteSaleMutation = useMutation({
    mutationFn: (saleId: number) =>
      apiRequest(`/api/sales/${saleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'], exact: false });
      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSale = (sale: Sale) => {
    deleteSaleMutation.mutate(sale.id);
  };

  const exportToPDF = async () => {
    if (filteredSales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter",
        variant: "destructive",
      });
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      doc.setFont('helvetica');
      
      doc.setFontSize(16);
      doc.text('Registre Détaillé des Ventes de Feux d\'Artifice', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 30);
      
      if (startDate || endDate) {
        const period = `Période: ${startDate ? new Date(startDate).toLocaleDateString('fr-FR') : 'début'} - ${endDate ? new Date(endDate).toLocaleDateString('fr-FR') : 'fin'}`;
        doc.text(period, 20, 35);
      }

      let currentY = startDate || endDate ? 50 : 45;

      // Pour chaque vente, créer une section complète
      filteredSales.forEach((sale, saleIndex) => {
        // Vérifier si on a assez de place, sinon nouvelle page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Titre de la vente
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`VENTE #${sale.id} - ${new Date(sale.timestamp).toLocaleDateString('fr-FR')} ${new Date(sale.timestamp).toLocaleTimeString('fr-FR')}`, 20, currentY);
        currentY += 10;

        // Informations vendeur
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Vendeur: ${sale.vendeur}`, 20, currentY);
        currentY += 8;

        // Informations client
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS CLIENT:', 20, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Nom: ${sale.nom} ${sale.prenom}`, 25, currentY);
        currentY += 5;
        doc.text(`Date de naissance: ${sale.dateNaissance || 'Non spécifiée'}`, 25, currentY);
        currentY += 5;
        doc.text(`Lieu de naissance: ${sale.lieuNaissance || 'Non spécifié'}`, 25, currentY);
        currentY += 5;
        doc.text(`Mode de paiement: ${sale.modePaiement || 'Non spécifié'}`, 25, currentY);
        currentY += 8;

        // Informations identité
        doc.setFont('helvetica', 'bold');
        doc.text('PIÈCE D\'IDENTITÉ:', 20, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Type: ${sale.typeIdentite || 'Non spécifié'}`, 25, currentY);
        currentY += 5;
        doc.text(`Numéro: ${sale.numeroIdentite || 'Non spécifié'}`, 25, currentY);
        currentY += 5;
        doc.text(`Autorité de délivrance: ${sale.autoriteDelivrance || 'Non spécifiée'}`, 25, currentY);
        currentY += 5;
        doc.text(`Date de délivrance: ${sale.dateDelivrance || 'Non spécifiée'}`, 25, currentY);
        currentY += 8;

        // Produits
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUITS VENDUS:', 20, currentY);
        currentY += 6;

        if (sale.products && sale.products.length > 0) {
          sale.products.forEach((product, productIndex) => {
            doc.setFont('helvetica', 'normal');
            doc.text(`Produit ${productIndex + 1}:`, 25, currentY);
            currentY += 5;
            doc.text(`  • Type: ${product.typeArticle}`, 30, currentY);
            currentY += 4;
            doc.text(`  • Catégorie: ${product.categorie}`, 30, currentY);
            currentY += 4;
            doc.text(`  • Quantité: ${product.quantite}`, 30, currentY);
            currentY += 4;
            doc.text(`  • Code: ${product.gencode || 'Non spécifié'}`, 30, currentY);
            currentY += 6;
          });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.text('Aucun produit enregistré', 25, currentY);
          currentY += 6;
        }

        // Photos
        if (sale.photoRecto || sale.photoVerso || sale.photoTicket) {
          doc.setFont('helvetica', 'bold');
          doc.text('DOCUMENTS PHOTOGRAPHIÉS:', 20, currentY);
          currentY += 6;
          doc.setFont('helvetica', 'normal');
          
          if (sale.photoRecto) {
            doc.text('✓ Photo recto pièce d\'identité', 25, currentY);
            currentY += 5;
          }
          if (sale.photoVerso) {
            doc.text('✓ Photo verso pièce d\'identité', 25, currentY);
            currentY += 5;
          }
          if (sale.photoTicket) {
            doc.text('✓ Photo ticket/reçu', 25, currentY);
            currentY += 5;
          }
          currentY += 5;
        }

        // Ligne de séparation si pas la dernière vente
        if (saleIndex < filteredSales.length - 1) {
          doc.setLineWidth(0.5);
          doc.line(20, currentY, 190, currentY);
          currentY += 15;
        }
      });

      doc.save(`registre-detaille-feux-artifice-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export réussi",
        description: "Le registre détaillé PDF a été téléchargé",
        variant: "success",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier PDF",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = [
        'Date', 'Vendeur', 'Nom', 'Prénom', 'Date de naissance', 'Lieu de naissance',
        'Type article', 'Catégorie', 'Quantité', 'Gencode', 'Mode de paiement',
        'Type identité', 'Numéro identité', 'Autorité délivrance', 'Date délivrance'
      ];

      const csvData = filteredSales.map(sale => [
        new Date(sale.timestamp).toLocaleDateString('fr-FR'),
        sale.vendeur,
        sale.nom,
        sale.prenom,
        new Date(sale.dateNaissance).toLocaleDateString('fr-FR'),
        sale.lieuNaissance || '',
        sale.typeArticle,
        sale.categorie,
        sale.quantite,
        sale.gencode,
        sale.modePaiement,
        sale.typeIdentite,
        sale.numeroIdentite,
        sale.autoriteDelivrance || '',
        new Date(sale.dateDelivrance).toLocaleDateString('fr-FR')
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(';'))
        .join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ventes-feux-artifice-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export réussi",
        description: "Le fichier CSV a été téléchargé",
        variant: "success",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier CSV",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="elegant-card">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Module de recherche */}
      <div className="search-container">
        <div className="search-header">
          <Search className="h-5 w-5" />
          <span>Rechercher dans l'historique</span>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Rechercher par nom, prénom, vendeur, article, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredSales.length} résultat{filteredSales.length > 1 ? 's' : ''} trouvé{filteredSales.length > 1 ? 's' : ''} sur {sales.length} vente{sales.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="section-header mb-4">
          <Filter className="h-5 w-5" />
          <span>Filtres par date</span>
        </div>
        <div className="filters-grid">
          <div>
            <label className="block text-sm font-medium mb-2">Date de début</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="modern-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date de fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="modern-input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="modern-button modern-button-secondary"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Actions d'export */}
      <div className="elegant-card">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <History className="h-5 w-5" />
                <span className="font-medium">
                  {filteredSales.length} vente{filteredSales.length > 1 ? 's' : ''}
                </span>
              </div>
              {searchQuery && (
                <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Recherche active
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                disabled={filteredSales.length === 0}
                className="modern-button modern-button-secondary"
              >
                <FileText className="h-4 w-4" />
                Registre PDF Détaillé
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredSales.length === 0}
                className="modern-button modern-button-secondary"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table des ventes */}
      <div className="elegant-card">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Date et Heure</th>
                <th>Vendeur</th>
                <th>Client</th>
                <th>Article</th>
                <th>Cat.</th>
                <th>Qté</th>
                <th>Paiement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucune vente enregistrée'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-mono text-sm">
                      <div>{new Date(sale.timestamp).toLocaleDateString('fr-FR')}</div>
                      <div className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="font-medium">{sale.vendeur}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{sale.nom} {sale.prenom}</span>
                      </div>
                    </td>
                    <td className="text-sm">{sale.typeArticle}</td>
                    <td>
                      <span className={`modern-badge ${
                        sale.categorie === 'F3' ? 'badge-destructive' : 'badge-secondary'
                      }`}>
                        {sale.categorie}
                      </span>
                    </td>
                    <td className="text-center">{sale.quantite}</td>
                    <td className="text-sm">{sale.modePaiement}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedSale(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la vente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette vente ?
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <p><strong>Client :</strong> {sale.nom} {sale.prenom}</p>
                                    <p><strong>Article :</strong> {sale.typeArticle}</p>
                                    <p><strong>Date :</strong> {new Date(sale.timestamp).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSale(sale)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de détails de la vente */}
      <SaleDetailsModal 
        isOpen={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}