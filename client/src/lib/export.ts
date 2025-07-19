import { Sale } from '@/types/sale';

// Fonction utilitaire pour télécharger un fichier
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Fonction utilitaire pour télécharger une image base64
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToExcel(sales: Sale[]): Promise<void> {
  if (sales.length === 0) return;

  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Créer la feuille principale des ventes
    const mainWorksheet = workbook.addWorksheet('Ventes');
    
    // Définir les colonnes
    mainWorksheet.columns = [
      { header: 'ID Vente', key: 'id', width: 8 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Heure', key: 'heure', width: 8 },
      { header: 'Vendeur', key: 'vendeur', width: 15 },
      { header: 'Nom', key: 'nom', width: 15 },
      { header: 'Prénom', key: 'prenom', width: 15 },
      { header: 'Date de naissance', key: 'dateNaissance', width: 15 },
      { header: 'Lieu de naissance', key: 'lieuNaissance', width: 20 },
      { header: 'Type d\'identité', key: 'typeIdentite', width: 15 },
      { header: 'Numéro d\'identité', key: 'numeroIdentite', width: 15 },
      { header: 'Autorité de délivrance', key: 'autoriteDeLivrance', width: 20 },
      { header: 'Date de délivrance', key: 'dateDelivrance', width: 15 },
      { header: 'Mode de paiement', key: 'modePaiement', width: 15 },
      { header: 'Produit N°', key: 'produitNumero', width: 8 },
      { header: 'Type d\'article', key: 'typeArticle', width: 20 },
      { header: 'Catégorie', key: 'categorie', width: 15 },
      { header: 'Quantité', key: 'quantite', width: 8 },
      { header: 'Code générique', key: 'gencode', width: 15 }
    ];
    
    // Ajouter les données des ventes
    sales.forEach(sale => {
      if (sale.products && sale.products.length > 0) {
        sale.products.forEach((product, index) => {
          mainWorksheet.addRow({
            id: sale.id,
            date: formatDate(sale.timestamp),
            heure: new Date(sale.timestamp).toLocaleTimeString('fr-FR'),
            vendeur: sale.vendeur,
            nom: sale.nom,
            prenom: sale.prenom,
            dateNaissance: sale.dateNaissance || '',
            lieuNaissance: sale.lieuNaissance || '',
            typeIdentite: sale.typeIdentite || '',
            numeroIdentite: sale.numeroIdentite || '',
            autoriteDeLivrance: sale.autoriteDelivrance || '',
            dateDelivrance: sale.dateDelivrance || '',
            modePaiement: sale.modePaiement || '',
            produitNumero: index + 1,
            typeArticle: product.typeArticle,
            categorie: product.categorie,
            quantite: product.quantite,
            gencode: product.gencode || ''
          });
        });
      } else {
        // Fallback pour les ventes sans produits
        mainWorksheet.addRow({
          id: sale.id,
          date: formatDate(sale.timestamp),
          heure: new Date(sale.timestamp).toLocaleTimeString('fr-FR'),
          vendeur: sale.vendeur,
          nom: sale.nom,
          prenom: sale.prenom,
          dateNaissance: sale.dateNaissance || '',
          lieuNaissance: sale.lieuNaissance || '',
          typeIdentite: sale.typeIdentite || '',
          numeroIdentite: sale.numeroIdentite || '',
          autoriteDeLivrance: sale.autoriteDelivrance || '',
          dateDelivrance: sale.dateDelivrance || '',
          modePaiement: sale.modePaiement || '',
          produitNumero: 'N/A',
          typeArticle: 'N/A',
          categorie: 'N/A',
          quantite: 0,
          gencode: ''
        });
      }
    });

    // Créer une feuille pour les photos si disponibles
    const salesWithPhotos = sales.filter(sale => sale.photo_recto || sale.photo_verso || sale.photo_ticket);
    
    if (salesWithPhotos.length > 0) {
      const photosWorksheet = workbook.addWorksheet('Photos');
      
      // Définir les colonnes pour les photos (plus larges pour les images)
      photosWorksheet.columns = [
        { header: 'ID Vente', key: 'id', width: 10 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Client', key: 'client', width: 25 },
        { header: 'Vendeur', key: 'vendeur', width: 15 },
        { header: 'Photo Recto', key: 'photoRecto', width: 25 },
        { header: 'Photo Verso', key: 'photoVerso', width: 25 },
        { header: 'Photo Ticket', key: 'photoTicket', width: 25 }
      ];
      
      // Ajouter les données et images
      for (let i = 0; i < salesWithPhotos.length; i++) {
        const sale = salesWithPhotos[i];
        const rowIndex = i + 2; // +2 car la ligne 1 est l'en-tête
        
        // Ajouter les données de base
        photosWorksheet.addRow({
          id: sale.id,
          date: formatDate(sale.timestamp),
          client: `${sale.nom} ${sale.prenom}`,
          vendeur: sale.vendeur,
          photoRecto: sale.photo_recto ? 'Image intégrée ci-dessous' : 'Non disponible',
          photoVerso: sale.photo_verso ? 'Image intégrée ci-dessous' : 'Non disponible',
          photoTicket: sale.photo_ticket ? 'Image intégrée ci-dessous' : 'Non disponible'
        });
        
        // Définir la hauteur de ligne pour les images (150 pixels = ~2cm)
        photosWorksheet.getRow(rowIndex).height = 150;
        
        try {
          // Ajouter l'image recto si disponible
          if (sale.photo_recto) {
            const rectoBase64 = sale.photo_recto.includes(',') ? sale.photo_recto.split(',')[1] : sale.photo_recto;
            const rectoBuffer = Buffer.from(rectoBase64, 'base64');
            const rectoImageId = workbook.addImage({
              buffer: rectoBuffer,
              extension: 'jpeg',
            });
            
            photosWorksheet.addImage(rectoImageId, {
              tl: { col: 4, row: rowIndex - 1 }, // colonne E (photoRecto)
              ext: { width: 120, height: 90 }
            });
          }
          
          // Ajouter l'image verso si disponible
          if (sale.photo_verso) {
            const versoBase64 = sale.photo_verso.includes(',') ? sale.photo_verso.split(',')[1] : sale.photo_verso;
            const versoBuffer = Buffer.from(versoBase64, 'base64');
            const versoImageId = workbook.addImage({
              buffer: versoBuffer,
              extension: 'jpeg',
            });
            
            photosWorksheet.addImage(versoImageId, {
              tl: { col: 5, row: rowIndex - 1 }, // colonne F (photoVerso)
              ext: { width: 120, height: 90 }
            });
          }
          
          // Ajouter l'image ticket si disponible
          if (sale.photo_ticket) {
            const ticketBase64 = sale.photo_ticket.includes(',') ? sale.photo_ticket.split(',')[1] : sale.photo_ticket;
            const ticketBuffer = Buffer.from(ticketBase64, 'base64');
            const ticketImageId = workbook.addImage({
              buffer: ticketBuffer,
              extension: 'jpeg',
            });
            
            photosWorksheet.addImage(ticketImageId, {
              tl: { col: 6, row: rowIndex - 1 }, // colonne G (photoTicket)
              ext: { width: 120, height: 90 }
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'ajout d\'images pour la vente', sale.id, error);
        }
      }
    }

    // Exporter le fichier Excel
    const fileName = `registre-feux-artifice-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Créer et télécharger le fichier
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    alert('Erreur lors de l\'export Excel. Veuillez réessayer.');
  }
}

export async function exportToCSV(sales: Sale[]): Promise<void> {
  if (sales.length === 0) return;

  const csvData: string[] = [];
  
  // En-têtes CSV
  const headers = [
    'ID Vente', 'Date', 'Heure', 'Vendeur', 'Nom', 'Prénom', 
    'Date de naissance', 'Lieu de naissance', 'Type d\'identité', 'Numéro d\'identité',
    'Autorité de délivrance', 'Date de délivrance', 'Mode de paiement',
    'Produit N°', 'Type d\'article', 'Catégorie', 'Quantité', 'Code générique'
  ];
  csvData.push(headers.join(';'));

  // Données
  sales.forEach(sale => {
    if (sale.products && sale.products.length > 0) {
      sale.products.forEach((product, index) => {
        const row = [
          sale.id,
          formatDate(sale.timestamp),
          new Date(sale.timestamp).toLocaleTimeString('fr-FR'),
          sale.vendeur,
          sale.nom,
          sale.prenom,
          sale.dateNaissance || '',
          sale.lieuNaissance || '',
          sale.typeIdentite || '',
          sale.numeroIdentite || '',
          sale.autoriteDelivrance || '',
          sale.dateDelivrance || '',
          sale.modePaiement || '',
          index + 1,
          product.typeArticle,
          product.categorie,
          product.quantite,
          product.gencode || ''
        ];
        csvData.push(row.join(';'));
      });
    } else {
      const row = [
        sale.id,
        formatDate(sale.timestamp),
        new Date(sale.timestamp).toLocaleTimeString('fr-FR'),
        sale.vendeur,
        sale.nom,
        sale.prenom,
        sale.dateNaissance || '',
        sale.lieuNaissance || '',
        sale.typeIdentite || '',
        sale.numeroIdentite || '',
        sale.autoriteDelivrance || '',
        sale.dateDelivrance || '',
        sale.modePaiement || '',
        'N/A',
        'N/A',
        'N/A',
        0,
        ''
      ];
      csvData.push(row.join(';'));
    }
  });

  const csvContent = csvData.join('\n');
  const fileName = `registre-feux-artifice-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR');
}

// Nouvelle fonction pour télécharger toutes les photos d'une sélection de ventes
export function downloadPhotosForSales(sales: Sale[]): void {
  let photoCount = 0;
  
  sales.forEach(sale => {
    const saleDate = new Date(sale.timestamp).toLocaleDateString('fr-FR').replace(/\//g, '-');
    const clientName = `${sale.nom}_${sale.prenom}`.replace(/\s+/g, '_');
    
    if (sale.photo_recto) {
      photoCount++;
      downloadImage(
        sale.photo_recto, 
        `Vente_${sale.id}_${saleDate}_${clientName}_Recto.jpg`
      );
    }
    
    if (sale.photo_verso) {
      photoCount++;
      downloadImage(
        sale.photo_verso, 
        `Vente_${sale.id}_${saleDate}_${clientName}_Verso.jpg`
      );
    }
    
    if (sale.photo_ticket) {
      photoCount++;
      downloadImage(
        sale.photo_ticket, 
        `Vente_${sale.id}_${saleDate}_${clientName}_Ticket.jpg`
      );
    }
  });
  
  if (photoCount > 0) {
    // Afficher une notification à l'utilisateur
    const message = `${photoCount} photo(s) vont être téléchargées séparément.`;
    if (window.confirm) {
      alert(message);
    } else {
      console.log(message);
    }
  }
}