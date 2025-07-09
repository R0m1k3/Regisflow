import { Sale } from '@/types/sale';

export function exportToCSV(sales: Sale[]): void {
  if (sales.length === 0) return;

  const headers = [
    'Date de vente',
    'Vendeur',
    'Type d\'article',
    'Catégorie',
    'Quantité',
    'Code générique',
    'Nom client',
    'Prénom client',
    'Date de naissance',
    'Lieu de naissance',
    'Type et n° identité',
    'Autorité de délivrance',
    'Date de délivrance',
    'Photo recto (Oui/Non)',
    'Photo verso (Oui/Non)',
    'Horodatage'
  ];

  const rows = sales.map(sale => [
    sale.dateVente,
    sale.vendeur,
    sale.typeArticle,
    sale.categorie,
    sale.quantite.toString(),
    sale.gencode || '',
    sale.nom,
    sale.prenom,
    sale.dateNaissance || '',
    sale.lieuNaissance || '',
    sale.typeIdentite || '',
    sale.autoriteDelivrance || '',
    sale.dateDelivrance || '',
    sale.photoRecto ? 'Oui' : 'Non',
    sale.photoVerso ? 'Oui' : 'Non',
    sale.timestamp
  ]);

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
