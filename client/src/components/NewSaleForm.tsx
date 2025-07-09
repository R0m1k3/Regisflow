import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { apiRequest } from '@/lib/queryClient';
import { validateRequiredFields, validateEAN13, ARTICLE_CATEGORY_MAPPING, IDENTITY_TYPES } from '@/lib/validation';
import { Package, User, Users, Save, X } from 'lucide-react';

interface FormData {
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
}

export default function NewSaleForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedStoreId } = useStoreContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      vendeur: '',
      dateVente: new Date().toISOString().split('T')[0],
      typeArticle: '',
      categorie: '',
      quantite: '',
      gencode: '',
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      typeIdentite: '',
      numeroIdentite: '',
      autoriteDelivrance: '',
      dateDelivrance: '',
    }
  });

  const typeArticle = form.watch('typeArticle');
  const availableCategories = typeArticle ? ARTICLE_CATEGORY_MAPPING[typeArticle as keyof typeof ARTICLE_CATEGORY_MAPPING] || [] : [];

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const dataToSend = {
        ...saleData,
        // Include storeId for admin users
        ...(user?.role === 'admin' && selectedStoreId && { storeId: selectedStoreId })
      };
      
      const response = await apiRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({
        title: "Vente enregistrée",
        description: "La vente a été enregistrée avec succès",
      });
      form.reset({
        vendeur: '',
        dateVente: new Date().toISOString().split('T')[0],
        typeArticle: '',
        categorie: '',
        quantite: '',
        gencode: '',
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        typeIdentite: '',
        numeroIdentite: '',
        autoriteDelivrance: '',
        dateDelivrance: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement de la vente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      const missingFields = validateRequiredFields(data);
      if (missingFields.length > 0) {
        toast({
          title: "Champs manquants",
          description: `Veuillez remplir: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Validate EAN13
      if (!validateEAN13(data.gencode)) {
        toast({
          title: "Code EAN13 invalide",
          description: "Le gencode doit être un code EAN13 valide à 13 chiffres",
          variant: "destructive",
        });
        return;
      }

      const saleData = {
        vendeur: data.vendeur,
        dateVente: data.dateVente,
        typeArticle: data.typeArticle,
        categorie: data.categorie as 'F2' | 'F3',
        quantite: parseInt(data.quantite),
        gencode: data.gencode,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        lieuNaissance: data.lieuNaissance || undefined,
        typeIdentite: data.typeIdentite,
        numeroIdentite: data.numeroIdentite,
        autoriteDelivrance: data.autoriteDelivrance,
        dateDelivrance: data.dateDelivrance,
      };

      await createSaleMutation.mutateAsync(saleData);
    } catch (error) {
      console.error('Sale creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Nouvelle Vente
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enregistrement d'une vente de feux d'artifice
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Seller Information */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations Vendeur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendeur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendeur <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du vendeur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateVente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de vente</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Product Information */}
            <div className="border-l-4 border-info pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-info" />
                Informations Produit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="typeArticle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'article <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('categorie', ''); // Reset category when article changes
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(ARTICLE_CATEGORY_MAPPING).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categorie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie réglementaire <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!typeArticle}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Entrez la quantité" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gencode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gencode (EAN13) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Code EAN13 à 13 chiffres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Alert className="mt-4">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <AlertDescription>
                  <strong>Information réglementaire :</strong>
                  <ul className="mt-1 space-y-1 text-sm">
                    <li>• <strong>F2</strong> : Feux d'artifice de catégorie F2 - Vente libre aux majeurs</li>
                    <li>• <strong>F3</strong> : Feux d'artifice de catégorie F3 - Vente soumise à autorisation préfectorale</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            {/* Customer Information */}
            <div className="border-l-4 border-success pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                Informations Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de famille <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de famille" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lieuNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Ville de naissance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Identity Information */}
            <div className="border-l-4 border-warning pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                Pièce d'Identité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="typeIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de pièce d'identité <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IDENTITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de pièce d'identité <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de la pièce d'identité" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autoriteDelivrance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autorité de délivrance <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Préfecture, Mairie, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateDelivrance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de délivrance <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions - Always visible */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-white">
              <Button type="button" variant="outline" onClick={() => {
                form.reset({
                  vendeur: '',
                  dateVente: new Date().toISOString().split('T')[0],
                  typeArticle: '',
                  categorie: '',
                  quantite: '',
                  gencode: '',
                  nom: '',
                  prenom: '',
                  dateNaissance: '',
                  lieuNaissance: '',
                  typeIdentite: '',
                  numeroIdentite: '',
                  autoriteDelivrance: '',
                  dateDelivrance: '',
                });
              }}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || createSaleMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting || createSaleMutation.isPending ? 'Enregistrement...' : 'Enregistrer la Vente'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}