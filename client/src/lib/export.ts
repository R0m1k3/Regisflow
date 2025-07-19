import { Sale } from '@/types/sale';

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

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR');
}
