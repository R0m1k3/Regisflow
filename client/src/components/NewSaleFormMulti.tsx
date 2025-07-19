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
import { useSimpleCamera } from '@/hooks/useSimpleCamera';

import { apiRequest } from '@/lib/queryClient';
import { validateRequiredFields, validateEAN13, ARTICLE_CATEGORY_MAPPING, IDENTITY_TYPES, PAYMENT_METHODS } from '@/lib/validation';
import { Package, User, Users, Save, Calendar, BadgeCheck, Info, Camera, Upload, Trash2, Plus, Minus } from 'lucide-react';
import SimpleCameraModal from '@/components/SimpleCameraModal';
import type { PhotoType, FormData } from '@/types/sale';

export default function NewSaleFormMulti() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedStoreId } = useStoreContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Camera functionality
  const {
    isOpen: isCameraOpen,
    currentPhotoType,
    isCapturing,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    stopCamera
  } = useSimpleCamera();

  const form = useForm<FormData>({
    defaultValues: {
      vendeur: '',
      products: [
        {
          typeArticle: '',
          categorie: '',
          quantite: '1',
          gencode: '',
        }
      ],
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
        ...(user?.role === 'administrator' && selectedStoreId && { storeId: selectedStoreId })
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
      form.reset();
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erreur lors de la création de la vente';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log('Form data:', data);
    setIsSubmitting(true);

    try {
      // Validation des champs requis
      const missingFields = validateRequiredFields(data);
      if (missingFields.length > 0) {
        toast({
          title: "Champs obligatoires manquants",
          description: `Veuillez remplir : ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validation EAN-13 pour tous les produits
      const invalidBarcodes = data.products.filter(product => !validateEAN13(product.gencode));
      if (invalidBarcodes.length > 0) {
        toast({
          title: "Code-barres invalide",
          description: "Certains codes EAN-13 ne sont pas valides",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await createSaleMutation.mutateAsync(data);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = async (photoType: PhotoType) => {
    console.log('=== PHOTO CAPTURE REQUESTED ===');
    console.log('Photo type:', photoType);
    
    // Vérifications préliminaires
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Navigateur non compatible",
        description: "Votre navigateur ne supporte pas la capture photo. Utilisez Chrome, Firefox ou Safari récent.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si nous sommes en HTTPS (requis par certains navigateurs)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast({
        title: "Connexion sécurisée requise",
        description: "L'accès à la caméra nécessite une connexion HTTPS.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Attempting to start camera...');
      
      // Afficher toast de démarrage
      toast({
        title: "Démarrage de la caméra",
        description: "Préparation de la caméra en cours...",
      });
      
      // Démarrer la caméra simple
      await startCamera(photoType);
      console.log('Simple camera started successfully');
      
    } catch (error) {
      console.error('Camera start failed:', error);
      toast({
        title: "Erreur d'accès à la caméra",
        description: error instanceof Error ? error.message : "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const handleCapturePhoto = async () => {
    if (!currentPhotoType) return;
    
    try {
      console.log('Attempting to capture photo...');
      const photoData = await capturePhoto();
      console.log('Photo captured successfully, data length:', photoData.length);
      
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
      
      stopCamera();
      
    } catch (error) {
      console.error('Photo capture failed:', error);
      toast({
        title: "Erreur de capture",
        description: error instanceof Error ? error.message : "Impossible de capturer la photo",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = (photoType: PhotoType) => {
    const field = photoType === 'recto' ? 'photoRecto' : 
                  photoType === 'verso' ? 'photoVerso' : 'photoTicket';
    form.setValue(field, '');
  };

  const handleFileUpload = (photoType: PhotoType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const field = photoType === 'recto' ? 'photoRecto' : 
                      photoType === 'verso' ? 'photoVerso' : 'photoTicket';
        form.setValue(field, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = () => {
    append({
      typeArticle: '',
      categorie: '',
      quantite: '1',
      gencode: '',
    });
  };

  const removeProduct = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getAvailableCategories = (typeArticle: string) => {
    return typeArticle ? ARTICLE_CATEGORY_MAPPING[typeArticle as keyof typeof ARTICLE_CATEGORY_MAPPING] || [] : [];
  };

  return (
    <div className="space-y-6">
      <SimpleCameraModal
        isOpen={isCameraOpen}
        photoType={currentPhotoType}
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        onClose={stopCamera}
        onCapture={handleCapturePhoto}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section Vendeur */}
          <div className="modern-section bg-blue-50 p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Informations vendeur</h3>
            </div>
            
            <FormField
              control={form.control}
              name="vendeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du vendeur *</FormLabel>
                  <FormControl>
                    <Input {...field} className="modern-input" placeholder="Nom du vendeur" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section Produits */}
          <div className="modern-section bg-green-50 p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Produits</h3>
              </div>
              <Button 
                type="button" 
                onClick={addProduct}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-300 hover:bg-green-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un produit
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-green-200 rounded-lg bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-700">Produit {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeProduct(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-100"
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
                          <FormLabel>Type d'article *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="modern-input">
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
                      name={`products.${index}.categorie`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="modern-input">
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableCategories(form.watch(`products.${index}.typeArticle`)).map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
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
                      name={`products.${index}.quantite`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" className="modern-input" placeholder="1" />
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
                          <FormLabel>Code EAN-13 *</FormLabel>
                          <FormControl>
                            <Input {...field} className="modern-input" placeholder="Code-barres EAN-13" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Client */}
          <div className="modern-section bg-purple-50 p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Informations client</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input {...field} className="modern-input" placeholder="Nom de famille" />
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
                      <Input {...field} className="modern-input" placeholder="Prénom" />
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
                      <Input {...field} className="modern-input" placeholder="Lieu de naissance" />
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
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
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
          <div className="modern-section bg-orange-50 p-6 border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">Pièce d'identité</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="typeIdentite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de pièce d'identité *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="modern-input">
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
                    <FormLabel>Numéro de pièce d'identité *</FormLabel>
                    <FormControl>
                      <Input {...field} className="modern-input" placeholder="Numéro de la pièce" />
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
                      <Input {...field} className="modern-input" placeholder="Optionnel" />
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

            {/* Photos */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-orange-700">Photos de la pièce d'identité</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo Recto */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo recto</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePhotoCapture('recto')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Caméra
                    </Button>
                    <label className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          Fichier
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('recto', e)}
                      />
                    </label>
                    {form.watch('photoRecto') && (
                      <Button
                        type="button"
                        onClick={() => handleRemovePhoto('recto')}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {form.watch('photoRecto') && (
                    <div className="text-xs text-green-600">✓ Photo recto capturée</div>
                  )}
                </div>

                {/* Photo Verso */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo verso</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePhotoCapture('verso')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Caméra
                    </Button>
                    <label className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          Fichier
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('verso', e)}
                      />
                    </label>
                    {form.watch('photoVerso') && (
                      <Button
                        type="button"
                        onClick={() => handleRemovePhoto('verso')}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {form.watch('photoVerso') && (
                    <div className="text-xs text-green-600">✓ Photo verso capturée</div>
                  )}
                </div>
              </div>

              {/* Photo Ticket */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo du ticket</label>
                <div className="flex gap-2 max-w-md">
                  <Button
                    type="button"
                    onClick={() => handlePhotoCapture('ticket')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Caméra
                  </Button>
                  <label className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        Fichier
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('ticket', e)}
                    />
                  </label>
                  {form.watch('photoTicket') && (
                    <Button
                      type="button"
                      onClick={() => handleRemovePhoto('ticket')}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {form.watch('photoTicket') && (
                  <div className="text-xs text-green-600">✓ Photo ticket capturée</div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="border"
            >
              Réinitialiser
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer la vente
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}