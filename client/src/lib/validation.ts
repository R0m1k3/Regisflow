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
  
  const missingFields = requiredFields
    .filter(field => {
      const value = formData[field.key];
      return !value || value.toString().trim() === '';
    })
    .map(field => field.label);

  // Validation des produits
  if (!formData.products || !Array.isArray(formData.products) || formData.products.length === 0) {
    missingFields.push('Au moins un produit');
  } else {
    formData.products.forEach((product: any, index: number) => {
      const productFields = [
        { key: 'typeArticle', label: `Type d'article (produit ${index + 1})` },
        { key: 'categorie', label: `Catégorie (produit ${index + 1})` },
        { key: 'quantite', label: `Quantité (produit ${index + 1})` },
        { key: 'gencode', label: `Code EAN-13 (produit ${index + 1})` }
      ];
      
      productFields.forEach(field => {
        const value = product[field.key];
        if (field.key === 'quantite') {
          // Pour la quantité, vérifier si c'est un nombre valide > 0
          if (!value || isNaN(Number(value)) || Number(value) <= 0) {
            missingFields.push(field.label);
          }
        } else {
          // Pour les autres champs produit
          if (!value || value.toString().trim() === '') {
            missingFields.push(field.label);
          }
        }
      });
    });
  }
  
  return missingFields;
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
  "Carte Nationale d'Identité",
  "Passeport", 
  "Permis de conduire"
] as const;

export const PAYMENT_METHODS = [
  "Carte Bancaire",
  "Espèce",
  "Chèque", 
  "Carte Cadeau",
  "Autre"
] as const;
