import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, Save, Search, Eye, Trash2, BarChart3, AlertCircle } from 'lucide-react';
import { Sale } from '@/types/sale';
import { exportToCSV, formatDate } from '@/lib/export';
import { downloadBackup, getAutoBackup } from '@/lib/storage';
import SaleDetailsModal from './SaleDetailsModal';

interface SalesHistoryProps {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  onDeleteSale: (id: number) => Promise<void>;
}

export default function SalesHistory({ sales, isLoading, error, onDeleteSale }: SalesHistoryProps) {
  const { toast } = useToast();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune vente à exporter",
        description: "Il n'y a aucune vente enregistrée",
      });
      return;
    }

    try {
      exportToCSV(sales);
      toast({
        title: "Export réussi !",
        description: `${sales.length} vente(s) exportée(s)`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBackup = () => {
    const backup = getAutoBackup();
    if (!backup) {
      toast({
        title: "Aucune sauvegarde disponible",
        description: "Aucun backup automatique trouvé",
      });
      return;
    }

    try {
      downloadBackup();
      toast({
        title: "Backup téléchargé",
        description: "Sauvegarde téléchargée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDiagnostic = () => {
    console.log('=== DIAGNOSTIC COMPLET ===');
    console.log('Nombre de ventes:', sales.length);
    console.log('Données:', sales);
    console.log('LocalStorage backup:', getAutoBackup());
    
    toast({
      title: "Diagnostic affiché",
      description: "Vérifiez la console pour les détails",
    });
  };

  const handleDeleteSale = async (sale: Sale) => {
    const confirmed = window.confirm(
      `Supprimer définitivement la vente de ${sale.nom} ${sale.prenom} ?\n\n⚠️ Cette action est irréversible !\n\nID: ${sale.id}`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(sale.id);
      await onDeleteSale(sale.id);
      toast({
        title: "Vente supprimée",
        description: `Vente de ${sale.nom} ${sale.prenom} supprimée`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const backup = getAutoBackup();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Chargement des ventes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Historique des Ventes
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gestion et export des ventes enregistrées
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleExportCSV} className="bg-success hover:bg-success/90">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              <Button onClick={handleDownloadBackup} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Backup Auto
              </Button>
              <Button onClick={handleDiagnostic} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Debug
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Status Information */}
        <div className="px-6 py-3 bg-muted border-b border-border">
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Données stockées localement ({sales.length} vente{sales.length !== 1 ? 's' : ''}) • Export CSV compatible Excel • Sauvegarde automatique à chaque ajout
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {backup ? (
              <span>
                Dernier backup: {formatDate(backup.timestamp)} ({backup.recordCount} enreg.)
              </span>
            ) : (
              <span>Dernier backup: Aucun</span>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-muted-foreground">Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {formatDate(sale.dateVente)}
                      </TableCell>
                      <TableCell>
                        {sale.vendeur || 'Non spécifié'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.nom} {sale.prenom}</div>
                          {sale.typeIdentite && (
                            <div className="text-xs text-muted-foreground">{sale.typeIdentite}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.typeArticle}</div>
                          {sale.gencode && (
                            <div className="text-xs text-muted-foreground">{sale.gencode}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.categorie === 'F2' ? 'secondary' : 'destructive'}>
                          {sale.categorie}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.quantite}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSale(sale)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSale(sale)}
                            disabled={isDeleting === sale.id}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer la vente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <SaleDetailsModal
        isOpen={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </>
  );
}
