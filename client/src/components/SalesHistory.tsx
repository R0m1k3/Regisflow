import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { History, Download, Trash2, Eye, Filter, FileText } from 'lucide-react';

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

  // Query for sales
  const { data: salesData, isLoading } = useQuery<Sale[]>({
    queryKey: ['/api/sales', startDate, endDate, selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Always add storeId for queries
      if (selectedStoreId) {
        params.append('storeId', selectedStoreId.toString());
      }
      
      const queryString = params.toString();
      const response = await apiRequest(`/api/sales${queryString ? `?${queryString}` : ''}`);
      return response.json();
    },
    enabled: !!selectedStoreId && !!user, // Only run query when store is selected and user is loaded
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const sales = Array.isArray(salesData) ? salesData : [];

  // Delete mutation
  const deleteSaleMutation = useMutation({
    mutationFn: (saleId: number) =>
      apiRequest(`/api/sales/${saleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Invalidate all sales queries to refresh the history
      queryClient.invalidateQueries({ queryKey: ['/api/sales'], exact: false });
      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès",
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
    if (sales.length === 0) {
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
      
      // Configuration du document
      doc.setFont('helvetica');
      
      // Titre du document
      doc.setFontSize(16);
      doc.text('Historique des Ventes de Feux d\'Artifice', 20, 20);
      
      // Informations générales
      doc.setFontSize(10);
      doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
      doc.text(`Nombre de ventes: ${sales.length}`, 20, 35);
      
      if (startDate || endDate) {
        let periodText = 'Période: ';
        if (startDate) periodText += `du ${new Date(startDate).toLocaleDateString('fr-FR')} `;
        if (endDate) periodText += `au ${new Date(endDate).toLocaleDateString('fr-FR')}`;
        doc.text(periodText, 20, 40);
      }

      // Données du tableau
      const tableData = sales.map(sale => [
        new Date(sale.timestamp!).toLocaleDateString('fr-FR'),
        sale.vendeur,
        sale.typeArticle,
        sale.categorie,
        sale.quantite.toString(),
        sale.nom + ' ' + sale.prenom,
        sale.modePaiement || 'Espèce',
        sale.typeIdentite,
        sale.numeroIdentite
      ]);

      // Configuration du tableau
      autoTable(doc, {
        head: [['Date', 'Vendeur', 'Article', 'Cat.', 'Qté', 'Client', 'Paiement', 'ID Type', 'N° ID']],
        body: tableData,
        startY: startDate || endDate ? 50 : 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Date
          1: { cellWidth: 25 }, // Vendeur
          2: { cellWidth: 35 }, // Article
          3: { cellWidth: 12 }, // Catégorie
          4: { cellWidth: 12 }, // Quantité
          5: { cellWidth: 30 }, // Client
          6: { cellWidth: 20 }, // Paiement
          7: { cellWidth: 15 }, // ID Type
          8: { cellWidth: 25 }, // N° ID
        },
        margin: { left: 10, right: 10 },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text('RegisFlow - Registre des ventes de feux d\'artifice', 20, doc.internal.pageSize.height - 10);
      }

      // Téléchargement
      doc.save(`historique_ventes_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Export PDF réussi",
        description: `${sales.length} ventes exportées en PDF`,
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
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter",
        variant: "destructive",
      });
      return;
    }

    const csvHeader = [
      'Date/Heure',
      'Vendeur',
      'Date de vente',
      'Type d\'article',
      'Catégorie',
      'Quantité',
      'Gencode',
      'Nom client',
      'Prénom client',
      'Date de naissance',
      'Lieu de naissance',
      'Mode de paiement',
      'Type identité',
      'Numéro identité',
      'Autorité délivrance',
      'Date délivrance'
    ].join(',');

    const csvData = sales.map(sale => [
      new Date(sale.timestamp!).toLocaleString('fr-FR'),
      sale.vendeur,
      sale.dateVente,
      sale.typeArticle,
      sale.categorie,
      sale.quantite,
      sale.gencode,
      sale.nom,
      sale.prenom,
      sale.dateNaissance,
      sale.lieuNaissance || '',
      sale.modePaiement || 'Espèce',
      sale.typeIdentite,
      sale.numeroIdentite,
      sale.autoriteDelivrance,
      sale.dateDelivrance
    ].map(field => `"${field}"`).join(',')).join('\n');

    const csvContent = csvHeader + '\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventes_fireworks_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: `${sales.length} ventes exportées`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Card className="modern-card-elevated">
      <CardHeader className="mobile-card-header">
        <CardTitle className="flex items-center gap-2 sm:gap-3 responsive-title">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl">
            <History className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="truncate">Historique des Ventes</span>
        </CardTitle>
        <p className="text-muted-foreground mt-2 responsive-body">
          Consultation et gestion des ventes enregistrées
        </p>
      </CardHeader>
      <CardContent className="mobile-card-content mobile-form-responsive">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end mobile-form-section bg-muted bg-opacity-30 rounded-xl border border-border border-opacity-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1 w-full">
            <div>
              <label className="responsive-caption font-medium">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="responsive-body"
              />
            </div>
            <div>
              <label className="responsive-caption font-medium">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="responsive-body"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={exportToCSV} variant="outline" className="touch-friendly-button flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="touch-friendly-button flex-1 sm:flex-none">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Sales Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground responsive-body">
            Aucune vente trouvée
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="responsive-caption">Date/Heure</TableHead>
                  <TableHead className="responsive-caption">Vendeur</TableHead>
                  <TableHead className="responsive-caption">Client</TableHead>
                  <TableHead className="responsive-caption">Article</TableHead>
                  <TableHead className="responsive-caption">Quantité</TableHead>
                  <TableHead className="responsive-caption hidden lg:table-cell">Paiement</TableHead>
                  <TableHead className="responsive-caption hidden sm:table-cell">Gencode</TableHead>
                  <TableHead className="responsive-caption">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDateTime(sale.timestamp!)}</TableCell>
                    <TableCell>{sale.vendeur}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.nom} {sale.prenom}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sale.dateNaissance)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.typeArticle}</p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          sale.categorie === 'F3' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sale.categorie}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.quantite}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {sale.modePaiement || 'Espèce'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{sale.gencode}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSale(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la vente</DialogTitle>
                            </DialogHeader>
                            {selectedSale && (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium mb-2">Informations générales</h4>
                                  <p><strong>Date/Heure :</strong> {formatDateTime(selectedSale.timestamp!)}</p>
                                  <p><strong>Vendeur :</strong> {selectedSale.vendeur}</p>
                                  <p><strong>Date de vente :</strong> {formatDate(selectedSale.dateVente)}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Produit</h4>
                                  <p><strong>Type :</strong> {selectedSale.typeArticle}</p>
                                  <p><strong>Catégorie :</strong> {selectedSale.categorie}</p>
                                  <p><strong>Quantité :</strong> {selectedSale.quantite}</p>
                                  <p><strong>Gencode :</strong> {selectedSale.gencode}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Client</h4>
                                  <p><strong>Nom :</strong> {selectedSale.nom}</p>
                                  <p><strong>Prénom :</strong> {selectedSale.prenom}</p>
                                  <p><strong>Date de naissance :</strong> {formatDate(selectedSale.dateNaissance)}</p>
                                  {selectedSale.lieuNaissance && (
                                    <p><strong>Lieu de naissance :</strong> {selectedSale.lieuNaissance}</p>
                                  )}
                                  <p><strong>Mode de paiement :</strong> {selectedSale.modePaiement || 'Espèce'}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Pièce d'identité</h4>
                                  <p><strong>Type :</strong> {selectedSale.typeIdentite}</p>
                                  <p><strong>Numéro :</strong> {selectedSale.numeroIdentite}</p>
                                  <p><strong>Autorité :</strong> {selectedSale.autoriteDelivrance}</p>
                                  <p><strong>Date délivrance :</strong> {formatDate(selectedSale.dateDelivrance)}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleteSaleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.
                                  <br /><br />
                                  <strong>Client :</strong> {sale.nom} {sale.prenom}<br />
                                  <strong>Article :</strong> {sale.typeArticle}<br />
                                  <strong>Date :</strong> {formatDateTime(sale.timestamp!)}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}