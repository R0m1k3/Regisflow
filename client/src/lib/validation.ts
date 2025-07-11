export function validateEAN13(code: string): boolean {
  if (!code || code.length !== 13) return false;
  if (!/^\d{13}$/.test(code)) return false;
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(code[12]);
}

export function validateRequiredFields(formData: any): string[] {
  const requiredFields = [
    { key: 'vendeur', label: 'Vendeur' },
    { key: 'typeArticle', label: 'Type d\'article' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'quantite', label: 'Quantité' },
    { key: 'gencode', label: 'Gencode' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'dateNaissance', label: 'Date de naissance' },
    { key: 'lieuNaissance', label: 'Lieu de naissance' },
    { key: 'modePaiement', label: 'Mode de paiement' },
    { key: 'typeIdentite', label: 'Type de pièce d\'identité' },
    { key: 'numeroIdentite', label: 'Numéro de pièce d\'identité' },
    { key: 'dateDelivrance', label: 'Date de délivrance' }
    // Note: autoriteDelivrance n'est plus obligatoire
  ];
  
  return requiredFields
    .filter(field => {
      const value = formData[field.key];
      // Pour la quantité, accepter 0 comme valeur valide
      if (field.key === 'quantite') {
        return value === '' || value === null || value === undefined;
      }
      // Pour les autres champs, vérifier si vide ou juste des espaces
      return !value || value.toString().trim() === '';
    })
    .map(field => field.label);
}

export const ARTICLE_CATEGORY_MAPPING = {
  "Pétard à mèche": ["F3"],
  "Batterie": ["F3"],
  "Batterie nécessitant un support externe": ["F3"],
  "Combinaison": ["F3"],
  "Combinaison nécessitant un support externe": ["F3"],
  "Pétard aérien": ["F2", "F3"],
  "Pétard à composition flash": ["F3"],
  "Fusée": ["F2", "F3"],
  "Chandelle romaine": ["F2", "F3"],
  "Chandelle monocoup": ["F2", "F3"],
  "Fontaine": ["F2"]
} as const;

export const IDENTITY_TYPES = [
  { value: "CNI", label: "Carte Nationale d'Identité" },
  { value: "Passeport", label: "Passeport" },
  { value: "Permis de conduire", label: "Permis de conduire" }
] as const;

export const PAYMENT_METHODS = [
  { value: "Carte Bancaire", label: "Carte Bancaire" },
  { value: "Espèce", label: "Espèce" },
  { value: "Chèque", label: "Chèque" },
  { value: "Carte Cadeau", label: "Carte Cadeau" },
  { value: "Autre", label: "Autre" }
] as const;
