export interface Sale {
  id: number;
  timestamp: string;
  
  // Vendeur
  vendeur: string;
  
  // Produit
  typeArticle: string;
  categorie: 'F2' | 'F3';
  quantite: number;
  gencode: string;
  
  // Client
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  modePaiement: string;
  
  // Identité
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  
  // Photos (snake_case to match database)
  photo_recto?: string;
  photo_verso?: string;
  photo_ticket?: string;
}

export interface FormData {
  vendeur: string;
  typeArticle: string;
  categorie: string;
  quantite: string;
  gencode: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  modePaiement: string;
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  // Photos (camelCase for form handling, snake_case conversion happens in API)
  photoRecto?: string;
  photoVerso?: string;
  photoTicket?: string;
}

export type PhotoType = 'recto' | 'verso' | 'ticket';

export interface BackupData {
  timestamp: string;
  sales: Sale[];
  recordCount: number;
}
