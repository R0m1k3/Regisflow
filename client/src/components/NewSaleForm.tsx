import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';

import { apiRequest } from '@/lib/queryClient';
import { validateRequiredFields, validateEAN13, ARTICLE_CATEGORY_MAPPING, IDENTITY_TYPES, PAYMENT_METHODS } from '@/lib/validation';
import { Package, User, Users, Save, Calendar, BadgeCheck, Info, Camera, Upload, Trash2, Plus, X } from 'lucide-react';
import CameraModal from '@/components/CameraModal';
import type { PhotoType } from '@/types/sale';

interface Product {
  typeArticle: string;
  categorie: string;
  quantite: string;
  gencode: string;
}

interface FormData {
  vendeur: string;
  products: Product[];
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  modePaiement: string;
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  // Photos - using camelCase for form, converted to snake_case in API
  photoRecto?: string;
  photoVerso?: string;
  photoTicket?: string;
}

export default function NewSaleForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedStoreId } = useStoreContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      vendeur: '',
      products: [{ typeArticle: '', categorie: '', quantite: '1', gencode: '' }],
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      modePaiement: 'Espèce',
      typeIdentite: '',
      numeroIdentite: '',
      autoriteDelivrance: '',
      dateDelivrance: '',
      photoRecto: '',
      photoVerso: '',
      photoTicket: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products"
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const dataToSend = {
        ...saleData,
        ...(user?.role === 'admin' && selectedStoreId && { storeId: selectedStoreId })
      };
      
      const response = await apiRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'], exact: false });
      toast({
        title: "Vente enregistrée",
        description: "La vente a été enregistrée avec succès",
        variant: "success",
      });
      form.reset({
        vendeur: '',
        products: [{ typeArticle: '', categorie: '', quantite: '1', gencode: '' }],
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        modePaiement: 'Espèce',
        typeIdentite: '',
        numeroIdentite: '',
        autoriteDelivrance: '',
        dateDelivrance: '',
        photoRecto: '',
        photoVerso: '',
        photoTicket: '',
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

      const missingFields = validateRequiredFields(data);
      if (missingFields.length > 0) {
        toast({
          title: "Champs manquants",
          description: `Veuillez remplir: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Validation EAN13 pour chaque produit
      for (const product of data.products) {
        if (!validateEAN13(product.gencode)) {
          toast({
            title: "Code EAN13 invalide",
            description: `Le gencode "${product.gencode}" doit être un code EAN13 valide à 13 chiffres`,
            variant: "destructive",
          });
          return;
        }
      }

      const saleData = {
        vendeur: data.vendeur,
        products: data.products.map(product => ({
          typeArticle: product.typeArticle,
          categorie: product.categorie as 'F2' | 'F3',
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

  // Photo capture functions
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
      variant: "success",
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

  // File upload fallback
  const handleFileUpload = (photoType: PhotoType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Type de fichier invalide",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (photoType === 'recto') {
        form.setValue('photoRecto', result);
      } else if (photoType === 'verso') {
        form.setValue('photoVerso', result);
      } else if (photoType === 'ticket') {
        form.setValue('photoTicket', result);
      }
      toast({
        title: "Photo ajoutée",
        description: `Photo ${photoType} ajoutée avec succès`,
        variant: "success",
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="modern-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section Vendeur */}
            <div className="modern-section" style={{ backgroundColor: '#f0f9ff' }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Informations Vendeur</h3>
              </div>
              
              <FormField
                control={form.control}
                name="vendeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du vendeur *</FormLabel>
                    <FormControl>
                      <Input {...field} className="modern-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section Produits */}
            <div className="modern-section" style={{ backgroundColor: '#f0fdf4' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">Produits</h3>
                </div>
                <Button
                  type="button"
                  onClick={() => append({ typeArticle: '', categorie: '', quantite: '1', gencode: '' })}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-white">
                    <FormField
                      control={form.control}
                      name={`products.${index}.typeArticle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type d'article *</FormLabel>
                          <FormControl>
                            <Input {...field} className="modern-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`products.${index}.categorie`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="modern-input">
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="F2">F2</SelectItem>
                              <SelectItem value="F3">F3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`products.${index}.quantite`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" className="modern-input" />
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
                          <FormLabel>Gencode EAN13 *</FormLabel>
                          <FormControl>
                            <Input {...field} className="modern-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Client */}
            <div className="modern-section" style={{ backgroundColor: '#fefce8' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Informations Client</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} className="modern-input" />
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
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} className="modern-input" />
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
                      <FormLabel>Date de naissance *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="modern-input" />
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
                      <FormLabel>Lieu de naissance *</FormLabel>
                      <FormControl>
                        <Input {...field} className="modern-input" />
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
                      <FormLabel>Mode de paiement *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
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
            <div className="modern-section" style={{ backgroundColor: '#fdf2f8' }}>
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Pièce d'Identité</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="typeIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de pièce d'identité *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
                            <SelectValue placeholder="Choisir un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IDENTITY_TYPES.map((type) => (
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
                  name="numeroIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de pièce d'identité *</FormLabel>
                      <FormControl>
                        <Input {...field} className="modern-input" />
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
                        <Input {...field} className="modern-input" />
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
                      <FormLabel>Date de délivrance *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="modern-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photos pièce d'identité */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Photos de la pièce d'identité</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Recto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Photo Recto</label>
                    {form.watch('photoRecto') ? (
                      <div className="relative">
                        <img 
                          src={form.watch('photoRecto')} 
                          alt="Photo recto" 
                          className="w-full h-32 object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto('recto')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-24 border-dashed border-2"
                          onClick={() => handlePhotoCapture('recto')}
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Prendre photo
                        </Button>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleFileUpload('recto', e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-8 text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Ou choisir un fichier
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Verso */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Photo Verso</label>
                    {form.watch('photoVerso') ? (
                      <div className="relative">
                        <img 
                          src={form.watch('photoVerso')} 
                          alt="Photo verso" 
                          className="w-full h-32 object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto('verso')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-24 border-dashed border-2"
                          onClick={() => handlePhotoCapture('verso')}
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Prendre photo
                        </Button>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleFileUpload('verso', e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-8 text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Ou choisir un fichier
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Photo Ticket de caisse */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Photo du ticket de caisse</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Photo Ticket</label>
                  {form.watch('photoTicket') ? (
                    <div className="relative">
                      <img 
                        src={form.watch('photoTicket')} 
                        alt="Photo ticket" 
                        className="w-full h-32 object-cover border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto('ticket')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed border-2"
                        onClick={() => handlePhotoCapture('ticket')}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Prendre photo
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('ticket', e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-8 text-xs"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Ou choisir un fichier
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="modern-button modern-button-success flex-1"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer la vente'}
              </button>
              <button
                type="button"
                onClick={() => form.reset()}
                className="modern-button modern-button-secondary flex-1"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </Form>
      </div>
      
      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        photoType={currentPhotoType}
        onClose={() => {
          setIsCameraOpen(false);
          setCurrentPhotoType(null);
        }}
        onPhotoTaken={handlePhotoTaken}
      />
    </div>
  );
}