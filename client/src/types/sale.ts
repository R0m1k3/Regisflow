export interface Sale {
  id: number;
  timestamp: string;
  
  // Vendeur
  vendeur: string;
  dateVente: string;
  
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
  
  // Identité
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  
  // Photos
  photoRecto?: string;
  photoVerso?: string;
}

export interface FormData {
  vendeur: string;
  dateVente: string;
  typeArticle: string;
  categorie: string;
  quantite: string;
  gencode: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  photoRecto?: string;
  photoVerso?: string;
}

export type PhotoType = 'recto' | 'verso';

export interface BackupData {
  timestamp: string;
  sales: Sale[];
  recordCount: number;
}
