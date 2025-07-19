import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useStoreContext } from "@/hooks/useStoreContext";
import { Package, User, Users, IdCard, Camera, Plus, Minus, Info } from "lucide-react";
import { validateEAN13, ARTICLE_CATEGORY_MAPPING, PAYMENT_METHODS, IDENTITY_TYPES } from "@/lib/validation";
import SimpleCameraModal from "@/components/SimpleCameraModal";

// Types pour les photos
type PhotoType = 'recto' | 'verso' | 'ticket';

// Schema de validation pour un produit
const productSchema = z.object({
  typeArticle: z.string().min(1, "Type d'article requis"),
  categorie: z.string().min(1, "Catégorie requise"),
  quantite: z.string().min(1, "Quantité requise").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Quantité invalide"),
  gencode: z.string().length(13, "Code EAN-13 requis (13 chiffres)").refine(validateEAN13, "Code EAN-13 invalide"),
});

// Schema principal du formulaire
const formSchema = z.object({
  vendeur: z.string().min(1, "Vendeur requis"),
  products: z.array(productSchema).min(1, "Au moins un produit requis"),
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  dateNaissance: z.string().min(1, "Date de naissance requise"),
  lieuNaissance: z.string().min(1, "Lieu de naissance requis"),
  modePaiement: z.string().min(1, "Mode de paiement requis"),
  typeIdentite: z.string().min(1, "Type d'identité requis"),
  numeroIdentite: z.string().min(1, "Numéro d'identité requis"),
  autoriteDelivrance: z.string().optional(),
  dateDelivrance: z.string().min(1, "Date de délivrance requise"),
  photoRecto: z.string().optional(),
  photoVerso: z.string().optional(),
  photoTicket: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewSaleFormMultiProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedStoreId } = useStoreContext();
  
  // États pour les photos
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire avec valeurs par défaut
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendeur: '',
      products: [{ typeArticle: '', categorie: '', quantite: '1', gencode: '' }],
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      modePaiement: '',
      typeIdentite: '',
      numeroIdentite: '',
      autoriteDelivrance: '',
      dateDelivrance: '',
      photoRecto: '',
      photoVerso: '',
      photoTicket: '',
    },
  });

  // Gestion des produits dynamiques
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products"
  });

  // Mutation pour créer une vente
  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/sales`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Vente enregistrée",
        description: "La vente a été enregistrée avec succès",
      });
      
      // Réinitialiser le formulaire
      form.reset({
        vendeur: '',
        products: [{ typeArticle: '', categorie: '', quantite: '1', gencode: '' }],
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        modePaiement: '',
        typeIdentite: '',
        numeroIdentite: '',
        autoriteDelivrance: '',
        dateDelivrance: '',
        photoRecto: '',
        photoVerso: '',
        photoTicket: '',
      });
      
      // Invalider le cache des ventes
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement de la vente",
        variant: "destructive",
      });
    },
  });

  // Ajouter un nouveau produit
  const addProduct = () => {
    append({ typeArticle: '', categorie: '', quantite: '1', gencode: '' });
  };

  // Supprimer un produit
  const removeProduct = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Soumission du formulaire
  const onSubmit = async (data: FormData) => {
    if (!selectedStoreId) {
      toast({
        title: "Erreur",
        description: "Aucun magasin sélectionné",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const saleData = {
        storeId: selectedStoreId,
        vendeur: data.vendeur,
        products: data.products.map(product => ({
          typeArticle: product.typeArticle,
          categorie: product.categorie,
          quantite: parseInt(product.quantite),
          gencode: product.gencode,
        })),
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        lieuNaissance: data.lieuNaissance,
        modePaiement: data.modePaiement,
        typeIdentite: data.typeIdentite,
        numeroIdentite: data.numeroIdentite,
        autoriteDelivrance: data.autoriteDelivrance,
        dateDelivrance: data.dateDelivrance,
        photoRecto: data.photoRecto,
        photoVerso: data.photoVerso,
        photoTicket: data.photoTicket,
      };

      await createSaleMutation.mutateAsync(saleData);
    } catch (error) {
      console.error('Sale creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion des photos
  const handlePhotoCapture = (photoType: PhotoType) => {
    setCurrentPhotoType(photoType);
    setIsCameraOpen(true);
  };

  const handlePhotoTaken = (photoData: string) => {
    if (currentPhotoType === 'recto') {
      form.setValue('photoRecto', photoData);
    } else if (currentPhotoType === 'verso') {
      form.setValue('photoVerso', photoData);
    } else if (currentPhotoType === 'ticket') {
      form.setValue('photoTicket', photoData);
    }
    
    toast({
      title: "Photo capturée",
      description: `Photo ${currentPhotoType} enregistrée avec succès`,
    });
    
    setIsCameraOpen(false);
    setCurrentPhotoType(null);
  };

  const handleRemovePhoto = (photoType: PhotoType) => {
    if (photoType === 'recto') {
      form.setValue('photoRecto', '');
    } else if (photoType === 'verso') {
      form.setValue('photoVerso', '');
    } else if (photoType === 'ticket') {
      form.setValue('photoTicket', '');
    }
    
    toast({
      title: "Photo supprimée",
      description: `Photo ${photoType} supprimée`,
    });
  };

  return (
    <div className="elegant-card animate-slide-in">
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Vendeur */}
            <div className="section-vendor">
              <div className="section-header">
                <User className="h-5 w-5" />
                <span>Informations Vendeur</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="vendeur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendeur <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du vendeur" className="modern-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section Produits */}
            <div className="section-product">
              <div className="section-header">
                <Package className="h-5 w-5" />
                <span>Produits ({fields.length})</span>
                <Button
                  type="button"
                  onClick={addProduct}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="modern-card bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Produit {index + 1}
                      </h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeProduct(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`products.${index}.typeArticle`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'article <span className="text-destructive">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue(`products.${index}.categorie`, '');
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="modern-input">
                                  <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.keys(ARTICLE_CATEGORY_MAPPING).map((type) => (
                                  <SelectItem key={`type-${index}-${type}`} value={type}>
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
                        name={`products.${index}.categorie`}
                        render={({ field }) => {
                          const selectedType = form.watch(`products.${index}.typeArticle`);
                          const availableCategories = selectedType ? 
                            ARTICLE_CATEGORY_MAPPING[selectedType as keyof typeof ARTICLE_CATEGORY_MAPPING] || [] : [];

                          return (
                            <FormItem>
                              <FormLabel>Catégorie <span className="text-destructive">*</span></FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!selectedType}
                              >
                                <FormControl>
                                  <SelectTrigger className="modern-input">
                                    <SelectValue placeholder="Sélectionner la catégorie" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableCategories.map((cat) => (
                                    <SelectItem key={`cat-${index}-${cat}`} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${index}.quantite`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Quantité"
                                className="modern-input"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${index}.gencode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code EAN-13 <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Code EAN-13 (13 chiffres)"
                                className="modern-input"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Information réglementaire :</strong> F1 = vente interdite aux mineurs de moins de 12 ans • F2/F3 = artifices puissants réservés aux majeurs, vente encadrée
                </AlertDescription>
              </Alert>
            </div>

            {/* Section Client */}
            <div className="section-client">
              <div className="section-header">
                <Users className="h-5 w-5" />
                <span>Informations Client</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de famille" className="modern-input" {...field} />
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
                        <Input placeholder="Prénom" className="modern-input" {...field} />
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
                        <Input type="date" className="modern-input" {...field} />
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
                      <FormLabel>Lieu de naissance <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ville de naissance" className="modern-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modePaiement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode de paiement <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
                            <SelectValue placeholder="Mode de paiement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method, methodIndex) => (
                            <SelectItem key={`payment-method-${methodIndex}`} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section Identité */}
            <div className="section-identity">
              <div className="section-header">
                <IdCard className="h-5 w-5" />
                <span>Pièce d'Identité</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="typeIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'identité <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
                            <SelectValue placeholder="Type d'identité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IDENTITY_TYPES.map((type, typeIndex) => (
                            <SelectItem key={`identity-type-${typeIndex}`} value={type}>
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
                  name="numeroIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de la pièce" className="modern-input" {...field} />
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
                      <FormLabel>Autorité de délivrance</FormLabel>
                      <FormControl>
                        <Input placeholder="Autorité (optionnel)" className="modern-input" {...field} />
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
                        <Input type="date" className="modern-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section Photos */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Photos des documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Photo Recto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo Recto</label>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => handlePhotoCapture('recto')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {form.watch('photoRecto') ? 'Modifier' : 'Capturer'}
                      </Button>
                      {form.watch('photoRecto') && (
                        <Button
                          type="button"
                          onClick={() => handleRemovePhoto('recto')}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Photo Verso */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo Verso</label>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => handlePhotoCapture('verso')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {form.watch('photoVerso') ? 'Modifier' : 'Capturer'}
                      </Button>
                      {form.watch('photoVerso') && (
                        <Button
                          type="button"
                          onClick={() => handleRemovePhoto('verso')}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Photo Ticket */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo Ticket</label>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => handlePhotoCapture('ticket')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {form.watch('photoTicket') ? 'Modifier' : 'Capturer'}
                      </Button>
                      {form.watch('photoTicket') && (
                        <Button
                          type="button"
                          onClick={() => handleRemovePhoto('ticket')}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 text-lg font-medium"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer la vente"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Modal Camera */}
      <SimpleCameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setCurrentPhotoType(null);
        }}
        onPhotoTaken={handlePhotoTaken}
        title={`Capturer la photo ${currentPhotoType}`}
      />
    </div>
  );
}