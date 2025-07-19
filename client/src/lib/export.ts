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
    const XLSX = await import('xlsx');
    const { utils, writeFile } = XLSX;

    // Créer un nouveau classeur
    const workbook = utils.book_new();

    // Préparer les données pour la feuille principale
    const salesData: any[] = [];
    
    sales.forEach(sale => {
      if (sale.products && sale.products.length > 0) {
        // Pour chaque produit, créer une ligne avec les infos de la vente
        sale.products.forEach((product, productIndex) => {
          salesData.push({
            'ID Vente': sale.id,
            'Date et Heure': new Date(sale.timestamp).toLocaleString('fr-FR'),
            'Vendeur': sale.vendeur,
            'Produit N°': productIndex + 1,
            'Type Article': product.typeArticle,
            'Catégorie': product.categorie,
            'Quantité': product.quantite,
            'Code Générique': product.gencode || '',
            'Nom Client': sale.nom,
            'Prénom Client': sale.prenom,
            'Date Naissance': sale.dateNaissance || '',
            'Lieu Naissance': sale.lieuNaissance || '',
            'Mode Paiement': sale.modePaiement || '',
            'Type Identité': sale.typeIdentite || '',
            'Numéro Identité': sale.numeroIdentite || '',
            'Autorité Délivrance': sale.autoriteDelivrance || '',
            'Date Délivrance': sale.dateDelivrance || '',
            'Photo Recto': sale.photoRecto ? 'Oui' : 'Non',
            'Photo Verso': sale.photoVerso ? 'Oui' : 'Non',
            'Photo Ticket': sale.photoTicket ? 'Oui' : 'Non'
          });
        });
      } else {
        // Fallback pour les ventes sans produits
        salesData.push({
          'ID Vente': sale.id,
          'Date et Heure': new Date(sale.timestamp).toLocaleString('fr-FR'),
          'Vendeur': sale.vendeur,
          'Produit N°': 'N/A',
          'Type Article': 'N/A',
          'Catégorie': 'N/A',
          'Quantité': 0,
          'Code Générique': '',
          'Nom Client': sale.nom,
          'Prénom Client': sale.prenom,
          'Date Naissance': sale.dateNaissance || '',
          'Lieu Naissance': sale.lieuNaissance || '',
          'Mode Paiement': sale.modePaiement || '',
          'Type Identité': sale.typeIdentite || '',
          'Numéro Identité': sale.numeroIdentite || '',
          'Autorité Délivrance': sale.autoriteDelivrance || '',
          'Date Délivrance': sale.dateDelivrance || '',
          'Photo Recto': sale.photoRecto ? 'Oui' : 'Non',
          'Photo Verso': sale.photoVerso ? 'Oui' : 'Non',
          'Photo Ticket': sale.photoTicket ? 'Oui' : 'Non'
        });
      }
    });

    // Créer la feuille des ventes
    const salesWorksheet = utils.json_to_sheet(salesData);
    
    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 10 }, // ID Vente
      { wch: 18 }, // Date et Heure
      { wch: 15 }, // Vendeur
      { wch: 10 }, // Produit N°
      { wch: 25 }, // Type Article
      { wch: 10 }, // Catégorie
      { wch: 8 },  // Quantité
      { wch: 15 }, // Code Générique
      { wch: 15 }, // Nom Client
      { wch: 15 }, // Prénom Client
      { wch: 12 }, // Date Naissance
      { wch: 15 }, // Lieu Naissance
      { wch: 12 }, // Mode Paiement
      { wch: 12 }, // Type Identité
      { wch: 15 }, // Numéro Identité
      { wch: 18 }, // Autorité Délivrance
      { wch: 12 }, // Date Délivrance
      { wch: 10 }, // Photo Recto
      { wch: 10 }, // Photo Verso
      { wch: 10 }  // Photo Ticket
    ];
    
    salesWorksheet['!cols'] = columnWidths;

    // Ajouter la feuille au classeur
    utils.book_append_sheet(workbook, salesWorksheet, 'Ventes Détaillées');

    // Créer une feuille de résumé
    const summaryData = [
      { 'Statistique': 'Nombre total de ventes', 'Valeur': sales.length },
      { 'Statistique': 'Nombre total de produits vendus', 'Valeur': salesData.length },
      { 'Statistique': 'Date de génération', 'Valeur': new Date().toLocaleString('fr-FR') },
      { 'Statistique': 'Ventes avec photos recto', 'Valeur': sales.filter(s => s.photoRecto).length },
      { 'Statistique': 'Ventes avec photos verso', 'Valeur': sales.filter(s => s.photoVerso).length },
      { 'Statistique': 'Ventes avec photos ticket', 'Valeur': sales.filter(s => s.photoTicket).length }
    ];

    const summaryWorksheet = utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    utils.book_append_sheet(workbook, summaryWorksheet, 'Résumé');

    // Créer une feuille de photos si il y a des ventes avec photos
    const salesWithPhotos = sales.filter(sale => sale.photoRecto || sale.photoVerso || sale.photoTicket);
    
    if (salesWithPhotos.length > 0) {
      const photosData: any[] = [];
      
      salesWithPhotos.forEach(sale => {
        // Ajouter une ligne pour chaque vente avec photos
        const photoRow: any = {
          'ID Vente': sale.id,
          'Date': new Date(sale.timestamp).toLocaleDateString('fr-FR'),
          'Client': `${sale.nom} ${sale.prenom}`,
          'Vendeur': sale.vendeur
        };
        
        // Ajouter les informations sur les photos disponibles
        photoRow['Photo Recto'] = sale.photoRecto ? 'DISPONIBLE' : 'NON DISPONIBLE';
        photoRow['Photo Verso'] = sale.photoVerso ? 'DISPONIBLE' : 'NON DISPONIBLE';
        photoRow['Photo Ticket'] = sale.photoTicket ? 'DISPONIBLE' : 'NON DISPONIBLE';
        
        // Ajouter des informations sur la taille des photos pour référence
        if (sale.photoRecto) {
          const rectoSize = Math.round(sale.photoRecto.length / 1024);
          photoRow['Taille Recto (KB)'] = `${rectoSize} KB`;
        } else {
          photoRow['Taille Recto (KB)'] = 'N/A';
        }
        
        if (sale.photoVerso) {
          const versoSize = Math.round(sale.photoVerso.length / 1024);
          photoRow['Taille Verso (KB)'] = `${versoSize} KB`;
        } else {
          photoRow['Taille Verso (KB)'] = 'N/A';
        }
        
        if (sale.photoTicket) {
          const ticketSize = Math.round(sale.photoTicket.length / 1024);
          photoRow['Taille Ticket (KB)'] = `${ticketSize} KB`;
        } else {
          photoRow['Taille Ticket (KB)'] = 'N/A';
        }
        
        // Information pour accéder aux photos
        photoRow['Instructions'] = 'Voir détails de la vente dans l\'application pour télécharger les photos';
        
        photosData.push(photoRow);
      });
      
      const photosWorksheet = utils.json_to_sheet(photosData);
      
      // Ajuster la largeur des colonnes pour les photos
      photosWorksheet['!cols'] = [
        { wch: 10 }, // ID Vente
        { wch: 12 }, // Date
        { wch: 20 }, // Client
        { wch: 15 }, // Vendeur
        { wch: 15 }, // Photo Recto
        { wch: 15 }, // Photo Verso
        { wch: 15 }, // Photo Ticket
        { wch: 15 }, // Taille Recto (KB)
        { wch: 15 }, // Taille Verso (KB)
        { wch: 15 }, // Taille Ticket (KB)
        { wch: 40 }  // Instructions
      ];
      
      // Ajuster la hauteur des lignes pour mieux voir les liens
      const rowHeights: any[] = [];
      for (let i = 0; i <= photosData.length; i++) {
        rowHeights.push({ hpt: 20 });
      }
      photosWorksheet['!rows'] = rowHeights;
      
      utils.book_append_sheet(workbook, photosWorksheet, 'Photos');
    }

    // Exporter le fichier Excel
    const fileName = `registre-feux-artifice-${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(workbook, fileName);
    
    // Télécharger les photos séparément si disponibles
    if (salesWithPhotos.length > 0) {
      // Attendre un peu pour que l'Excel se télécharge d'abord
      setTimeout(() => {
        downloadPhotosForSales(salesWithPhotos);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    throw error;
  }
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
    
    if (sale.photoRecto) {
      photoCount++;
      downloadImage(
        sale.photoRecto, 
        `Vente_${sale.id}_${saleDate}_${clientName}_Recto.jpg`
      );
    }
    
    if (sale.photoVerso) {
      photoCount++;
      downloadImage(
        sale.photoVerso, 
        `Vente_${sale.id}_${saleDate}_${clientName}_Verso.jpg`
      );
    }
    
    if (sale.photoTicket) {
      photoCount++;
      downloadImage(
        sale.photoTicket, 
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

// Fonction CSV basique maintenue pour compatibilité si nécessaire
export function exportToCSV(sales: Sale[]): void {
  if (sales.length === 0) return;

  const headers = [
    'Date et heure de vente',
    'Vendeur',
    'Type d\'article',
    'Catégorie',
    'Quantité',
    'Code générique',
    'Nom client',
    'Prénom client',
    'Date de naissance',
    'Lieu de naissance',
    'Mode de paiement',
    'Type d\'identité',
    'Numéro d\'identité',
    'Autorité de délivrance',
    'Date de délivrance'
  ];

  // Créer une ligne pour chaque produit de chaque vente
  const rows: string[][] = [];
  
  sales.forEach(sale => {
    if (sale.products && sale.products.length > 0) {
      // Pour chaque produit, créer une ligne avec les infos de la vente
      sale.products.forEach(product => {
        rows.push([
          new Date(sale.timestamp).toLocaleString('fr-FR'),
          sale.vendeur,
          product.typeArticle,
          product.categorie,
          product.quantite.toString(),
          product.gencode || '',
          sale.nom,
          sale.prenom,
          sale.dateNaissance || '',
          sale.lieuNaissance || '',
          sale.modePaiement || '',
          sale.typeIdentite || '',
          sale.numeroIdentite || '',
          sale.autoriteDelivrance || '',
          sale.dateDelivrance || ''
        ]);
      });
    } else {
      // Fallback pour les ventes sans produits (anciennes données)
      rows.push([
        new Date(sale.timestamp).toLocaleString('fr-FR'),
        sale.vendeur,
        'N/A',
        'N/A',
        '0',
        '',
        sale.nom,
        sale.prenom,
        sale.dateNaissance || '',
        sale.lieuNaissance || '',
        sale.modePaiement || '',
        sale.typeIdentite || '',
        sale.numeroIdentite || '',
        sale.autoriteDelivrance || '',
        sale.dateDelivrance || ''
      ]);
    }
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  // Add BOM for UTF-8 Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ventes_petards_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(link.href);
}
