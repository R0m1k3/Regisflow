import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download } from 'lucide-react';
import { Sale } from '@/types/sale';
import { formatDate, formatDateTime } from '@/lib/export';

interface SaleDetailsModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
}

export default function SaleDetailsModal({ isOpen, sale, onClose }: SaleDetailsModalProps) {
  if (!sale) return null;

  // Fonction pour télécharger une photo
  const downloadPhoto = (photoData: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = photoData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mobile-modal-content max-w-4xl max-h-[90vh] overflow-y-auto slide-in-up">
        <DialogHeader className="mobile-padding">
          <DialogTitle className="responsive-title">Détails de la Vente</DialogTitle>
        </DialogHeader>
        
        <div className="mobile-spacing mobile-padding">
          {/* Seller Information */}
          <div className="mobile-form-section border-l-4 border-primary pl-4">
            <h4 className="responsive-subtitle text-gray-900 mb-3">Informations Vendeur</h4>
            <div className="mobile-form-row responsive-body">
              <div><span className="font-medium">Vendeur:</span> {sale.vendeur}</div>
              <div><span className="font-medium">Date de vente:</span> {formatDate(sale.dateVente)}</div>
            </div>
          </div>
          
          {/* Product Information */}
          <div className="mobile-form-section border-l-4 border-blue-500 pl-4">
            <h4 className="responsive-subtitle text-gray-900 mb-3">Informations Produit</h4>
            <div className="mobile-form-row responsive-body">
              <div><span className="font-medium">Type d'article:</span> {sale.typeArticle}</div>
              <div>
                <span className="font-medium">Catégorie:</span>{' '}
                <Badge variant={sale.categorie === 'F2' ? 'secondary' : 'destructive'}>
                  {sale.categorie}
                </Badge>
              </div>
              <div><span className="font-medium">Quantité:</span> {sale.quantite}</div>
              <div><span className="font-medium">Code produit:</span> {sale.gencode || 'Non spécifié'}</div>
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="mobile-form-section border-l-4 border-green-500 pl-4">
            <h4 className="responsive-subtitle text-gray-900 mb-3">Informations Client</h4>
            <div className="mobile-form-row responsive-body">
              <div><span className="font-medium">Nom:</span> {sale.nom}</div>
              <div><span className="font-medium">Prénom:</span> {sale.prenom}</div>
              <div>
                <span className="font-medium">Date de naissance:</span>{' '}
                {sale.dateNaissance ? formatDate(sale.dateNaissance) : 'Non spécifiée'}
              </div>
              <div><span className="font-medium">Lieu de naissance:</span> {sale.lieuNaissance || 'Non spécifié'}</div>
              <div><span className="font-medium">Mode de paiement:</span> {sale.modePaiement || 'Espèce'}</div>
            </div>
          </div>
          
          {/* Identity Document */}
          <div className="mobile-form-section border-l-4 border-yellow-500 pl-4">
            <h4 className="responsive-subtitle text-gray-900 mb-3">Pièce d'Identité</h4>
            <div className="mobile-form-row responsive-body">
              <div><span className="font-medium">Type:</span> {sale.typeIdentite || 'Non spécifié'}</div>
              <div><span className="font-medium">Numéro:</span> {sale.numeroIdentite || 'Non spécifié'}</div>
              <div><span className="font-medium">Autorité de délivrance:</span> {sale.autoriteDelivrance || 'Non spécifiée'}</div>
              <div>
                <span className="font-medium">Date de délivrance:</span>{' '}
                {sale.dateDelivrance ? formatDate(sale.dateDelivrance) : 'Non spécifiée'}
              </div>
            </div>
          </div>
          
          {/* Photos */}
          <div className="mobile-form-section border-l-4 border-purple-500 pl-4">
            <h4 className="responsive-subtitle text-gray-900 mb-3">Photos de la Pièce d'Identité</h4>
            <div className="mobile-form-row">
              <div>
                <span className="text-sm font-medium">Photo Recto:</span>
                {sale.photoRecto ? (
                  <div className="mt-2 space-y-2">
                    <img src={sale.photoRecto} alt="Photo recto" className="w-32 h-auto rounded border" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPhoto(sale.photoRecto!, `vente-${sale.id}-recto.jpg`)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger Recto
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Aucune photo</p>
                )}
              </div>
              <div>
                <span className="text-sm font-medium">Photo Verso:</span>
                {sale.photoVerso ? (
                  <div className="mt-2 space-y-2">
                    <img src={sale.photoVerso} alt="Photo verso" className="w-32 h-auto rounded border" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPhoto(sale.photoVerso!, `vente-${sale.id}-verso.jpg`)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger Verso
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Aucune photo</p>
                )}
              </div>
            </div>
          </div>
          
          {/* System Information */}
          <div className="border-l-4 border-gray-400 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">Informations Système</h4>
            <div className="text-sm">
              <div><span className="font-medium">Timestamp:</span> {formatDateTime(sale.timestamp)}</div>
              <div><span className="font-medium">ID:</span> {sale.id}</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
