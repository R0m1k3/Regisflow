import { Sale } from '@/types/sale';

export async function exportToExcel(sales: Sale[]): Promise<void> {
  if (sales.length === 0) return;

  try {
    const XLSX = await import('xlsx-js-style');
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
        if (sale.photoRecto) {
          photoRow['Photo Recto'] = 'DISPONIBLE';
          photoRow['Lien Recto'] = `data:image/jpeg;base64,${sale.photoRecto.split(',')[1] || sale.photoRecto}`;
        } else {
          photoRow['Photo Recto'] = 'NON DISPONIBLE';
          photoRow['Lien Recto'] = '';
        }
        
        if (sale.photoVerso) {
          photoRow['Photo Verso'] = 'DISPONIBLE';
          photoRow['Lien Verso'] = `data:image/jpeg;base64,${sale.photoVerso.split(',')[1] || sale.photoVerso}`;
        } else {
          photoRow['Photo Verso'] = 'NON DISPONIBLE';
          photoRow['Lien Verso'] = '';
        }
        
        if (sale.photoTicket) {
          photoRow['Photo Ticket'] = 'DISPONIBLE';
          photoRow['Lien Ticket'] = `data:image/jpeg;base64,${sale.photoTicket.split(',')[1] || sale.photoTicket}`;
        } else {
          photoRow['Photo Ticket'] = 'NON DISPONIBLE';
          photoRow['Lien Ticket'] = '';
        }
        
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
        { wch: 50 }, // Lien Recto
        { wch: 15 }, // Photo Verso
        { wch: 50 }, // Lien Verso
        { wch: 15 }, // Photo Ticket
        { wch: 50 }  // Lien Ticket
      ];
      
      // Ajuster la hauteur des lignes pour mieux voir les liens
      const rowHeights: any[] = [];
      for (let i = 0; i <= photosData.length; i++) {
        rowHeights.push({ hpt: 20 });
      }
      photosWorksheet['!rows'] = rowHeights;
      
      utils.book_append_sheet(workbook, photosWorksheet, 'Photos');
    }

    // Exporter le fichier
    const fileName = `registre-feux-artifice-${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(workbook, fileName);
    
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
