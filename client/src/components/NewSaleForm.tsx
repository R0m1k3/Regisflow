import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useCamera } from '@/hooks/useCamera';
import { apiRequest } from '@/lib/queryClient';
import { validateRequiredFields, validateEAN13, ARTICLE_CATEGORY_MAPPING, IDENTITY_TYPES, PAYMENT_METHODS } from '@/lib/validation';
import { Package, User, Users, Save, Calendar, BadgeCheck, Info, Camera } from 'lucide-react';
import CameraModal from '@/components/CameraModal';
import type { PhotoType } from '@/types/sale';

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
  modePaiement: string;
  typeIdentite: string;
  numeroIdentite: string;
  autoriteDelivrance: string;
  dateDelivrance: string;
  photoRecto?: string;
  photoVerso?: string;
}

export default function NewSaleForm() {
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
  } = useCamera();

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
      modePaiement: 'Espèce',
      typeIdentite: '',
      numeroIdentite: '',
      autoriteDelivrance: '',
      dateDelivrance: '',
      photoRecto: '',
      photoVerso: '',
    }
  });

  const typeArticle = form.watch('typeArticle');
  const availableCategories = typeArticle ? ARTICLE_CATEGORY_MAPPING[typeArticle as keyof typeof ARTICLE_CATEGORY_MAPPING] || [] : [];

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
        dateVente: new Date().toISOString().split('T')[0],
        typeArticle: '',
        categorie: '',
        quantite: '',
        gencode: '',
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
        typeArticle: data.typeArticle,
        categorie: data.categorie as 'F2' | 'F3',
        quantite: parseInt(data.quantite),
        gencode: data.gencode,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        lieuNaissance: data.lieuNaissance,
        typeIdentite: data.typeIdentite,
        numeroIdentite: data.numeroIdentite,
        autoriteDelivrance: data.autoriteDelivrance,
        dateDelivrance: data.dateDelivrance,
        photoRecto: data.photoRecto,
        photoVerso: data.photoVerso,
      };

      await createSaleMutation.mutateAsync(saleData);
    } catch (error) {
      console.error('Sale creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Photo capture functions
  const handlePhotoCapture = async (photoType: PhotoType) => {
    try {
      await startCamera(photoType);
    } catch (error) {
      toast({
        title: "Erreur caméra",
        description: error instanceof Error ? error.message : "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const handleTakePhoto = async () => {
    if (!currentPhotoType) return;
    
    try {
      const photoData = await capturePhoto();
      form.setValue(currentPhotoType === 'recto' ? 'photoRecto' : 'photoVerso', photoData);
      
      toast({
        title: "Photo capturée",
        description: `Photo ${currentPhotoType} enregistrée avec succès`,
        variant: "success",
      });
      
      stopCamera();
    } catch (error) {
      toast({
        title: "Erreur de capture",
        description: error instanceof Error ? error.message : "Erreur lors de la capture",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = (photoType: PhotoType) => {
    form.setValue(photoType === 'recto' ? 'photoRecto' : 'photoVerso', '');
    toast({
      title: "Photo supprimée",
      description: `Photo ${photoType} supprimée`,
      variant: "success",
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

            {/* Section Produit */}
            <div className="section-product">
              <div className="section-header">
                <Package className="h-5 w-5" />
                <span>Informations Produit</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="typeArticle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'article <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('categorie', '');
                      }}>
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
                  name="categorie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie réglementaire <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!typeArticle}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
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
                        <Input type="number" min="1" placeholder="Entrez la quantité" className="modern-input" {...field} />
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
                        <Input placeholder="Code EAN13 à 13 chiffres" className="modern-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Nom de famille <span className="text-destructive">*</span></FormLabel>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="modern-input">
                            <SelectValue placeholder="Sélectionner le mode de paiement" />
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
            <div className="section-identity">
              <div className="section-header">
                <BadgeCheck className="h-5 w-5" />
                <span>Pièce d'Identité</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="typeIdentite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de pièce d'identité <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                      <FormLabel>Numéro de pièce d'identité <span className="text-destructive">*</span></FormLabel>
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
                        <Input placeholder="Autorité ayant délivré la pièce (optionnel)" className="modern-input" {...field} />
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
                <h4 className="text-sm font-medium text-gray-700">Photos de la pièce d'identité</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo Recto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Photo Recto</label>
                    {form.watch('photoRecto') ? (
                      <div className="relative">
                        <img 
                          src={form.watch('photoRecto')} 
                          alt="Photo recto" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto('recto')}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-32 border-dashed border-2"
                        onClick={() => handlePhotoCapture('recto')}
                      >
                        <Camera className="h-6 w-6 mr-2" />
                        Prendre photo recto
                      </Button>
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
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto('verso')}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-32 border-dashed border-2"
                        onClick={() => handlePhotoCapture('verso')}
                      >
                        <Camera className="h-6 w-6 mr-2" />
                        Prendre photo verso
                      </Button>
                    )}
                  </div>
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
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        onClose={stopCamera}
        onCapture={handleTakePhoto}
      />
    </div>
  );
}