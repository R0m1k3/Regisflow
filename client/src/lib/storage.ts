// Utilitaires pour l'export et la gestion des données
// L'application utilise PostgreSQL via l'API backend

import { Sale, BackupData } from '@/types/sale';

// Fonction utilitaire pour télécharger des données JSON
export function downloadJSON(data: any, filename: string): void {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', filename);
  linkElement.click();
}

// Fonction utilitaire pour créer un CSV des ventes
export function exportSalesToCSV(sales: Sale[]): void {
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
  ];

  const csvData = sales.map(sale => [
    sale.timestamp ? new Date(sale.timestamp).toLocaleString('fr-FR') : '',
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
  ]);

  const csvContent = [csvHeader, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ventes_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  URL.revokeObjectURL(url);
}