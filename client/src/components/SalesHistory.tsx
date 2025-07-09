import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Sale } from '@shared/schema';
import { History, Download, Trash2, Eye, Filter } from 'lucide-react';

interface SalesHistoryProps {
  canDelete?: boolean;
}

export default function SalesHistory({ canDelete = false }: SalesHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Query for sales
  const { data: salesData, isLoading } = useQuery<Sale[]>({
    queryKey: ['/api/sales', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryString = params.toString();
      const response = await apiRequest(`/api/sales${queryString ? `?${queryString}` : ''}`);
      return response.json();
    },
  });

  const sales = Array.isArray(salesData) ? salesData : [];

  // Delete mutation
  const deleteSaleMutation = useMutation({
    mutationFn: (saleId: number) =>
      apiRequest(`/api/sales/${saleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
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

  const handleDeleteSale = async (sale: Sale) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette vente ?`)) {
      deleteSaleMutation.mutate(sale.id);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Ventes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 items-end">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div>
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Sales Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune vente trouvée
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Gencode</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{sale.gencode}</TableCell>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSale(sale)}
                            disabled={deleteSaleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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