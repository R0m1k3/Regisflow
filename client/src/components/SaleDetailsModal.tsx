import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download } from 'lucide-react';
import { Sale } from '@shared/schema';
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
          <div className="border border-gray-200 p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Informations Vendeur</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Vendeur:</span> {sale.vendeur}</div>
              <div><span className="font-medium">Date de vente:</span> {formatDateTime(sale.timestamp)}</div>
            </div>
          </div>
          
          {/* Product Information */}
          <div className="border border-gray-200 p-4 bg-white">
            <h4 className="font-medium text-gray-900 mb-3">Informations Produit</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Type d'article:</span> {sale.typeArticle}</div>
              <div><span className="font-medium">Catégorie:</span> {sale.categorie}</div>
              <div><span className="font-medium">Quantité:</span> {sale.quantite}</div>
              <div><span className="font-medium">Code produit:</span> {sale.gencode || 'Non spécifié'}</div>
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="border border-gray-200 p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Informations Client</h4>
            <div className="text-sm space-y-1">
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
          <div className="border border-gray-200 p-4 bg-white">
            <h4 className="font-medium text-gray-900 mb-3">Pièce d'Identité</h4>
            <div className="text-sm space-y-1">
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
          {(sale.photo_recto || sale.photo_verso || sale.photo_ticket) && (
            <div className="border border-gray-200 p-4 bg-white">
              <h4 className="font-medium text-gray-900 mb-4">Photos</h4>
              
              {/* Photos de la pièce d'identité */}
              {(sale.photo_recto || sale.photo_verso) && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Pièce d'identité</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sale.photo_recto && (
                      <div>
                        <span className="text-xs text-gray-600 mb-2 block">Photo Recto</span>
                        <img src={sale.photo_recto} alt="Photo recto" className="w-full h-48 object-cover border mb-2" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPhoto(sale.photo_recto!, `vente-${sale.id}-recto.jpg`)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger Recto
                        </Button>
                      </div>
                    )}
                    {sale.photo_verso && (
                      <div>
                        <span className="text-xs text-gray-600 mb-2 block">Photo Verso</span>
                        <img src={sale.photo_verso} alt="Photo verso" className="w-full h-48 object-cover border mb-2" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPhoto(sale.photo_verso!, `vente-${sale.id}-verso.jpg`)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger Verso
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photo du ticket de caisse */}
              {sale.photo_ticket && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Ticket de caisse</h5>
                  <div className="max-w-sm">
                    <img src={sale.photo_ticket} alt="Photo ticket" className="w-full h-auto border mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPhoto(sale.photo_ticket!, `vente-${sale.id}-ticket.jpg`)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger Ticket
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* System Information */}
          <div className="border border-gray-200 p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Informations Système</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">ID:</span> {sale.id}</div>
              <div><span className="font-medium">Timestamp:</span> {formatDateTime(sale.timestamp)}</div>
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
