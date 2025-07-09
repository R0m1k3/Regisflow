import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, User, Package, Users, IdCard, Save, X, Trash2 } from 'lucide-react';
import { Sale, FormData, PhotoType } from '@/types/sale';
import { validateRequiredFields, validateEAN13, ARTICLE_CATEGORY_MAPPING, IDENTITY_TYPES } from '@/lib/validation';
import { useCamera } from '@/hooks/useCamera';
import CameraModal from './CameraModal';

interface NewSaleFormProps {
  onSaveSale: (sale: Omit<Sale, 'id' | 'timestamp'>) => Promise<Sale>;
}

export default function NewSaleForm({ onSaveSale }: NewSaleFormProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<{ recto?: string; verso?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const camera = useCamera();

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

  const handlePhotoCapture = async (photoType: PhotoType) => {
    try {
      await camera.startCamera(photoType);
      toast({
        title: "Caméra activée",
        description: "Positionnez la carte d'identité",
      });
    } catch (error) {
      toast({
        title: "Erreur caméra",
        description: error instanceof Error ? error.message : "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const handlePhotoTaken = (photoType: PhotoType, photoData: string) => {
    setPhotos(prev => ({ ...prev, [photoType]: photoData }));
    toast({
      title: "Photo capturée",
      description: `Photo ${photoType} sauvegardée avec succès`,
    });
  };

  const deletePhoto = (photoType: PhotoType) => {
    setPhotos(prev => {
      const newPhotos = { ...prev };
      delete newPhotos[photoType];
      return newPhotos;
    });
    toast({
      title: "Photo supprimée",
      description: `Photo ${photoType} supprimée`,
    });
  };

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

      // Validate EAN13 (now required)
      if (!validateEAN13(data.gencode)) {
        toast({
          title: "Code EAN13 invalide",
          description: "Le gencode doit être un code EAN13 valide à 13 chiffres",
          variant: "destructive",
        });
        return;
      }

      const saleData: Omit<Sale, 'id' | 'timestamp'> = {
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
        photoRecto: photos.recto,
        photoVerso: photos.verso,
      };

      await onSaveSale(saleData);

      // Reset form
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
      setPhotos({});

      toast({
        title: "Vente enregistrée",
        description: "La vente a été enregistrée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la vente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
                          <Input placeholder="Vendeur" {...field} />
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
                          <Input type="number" min="1" placeholder="1" {...field} />
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

              {/* Identity Document */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-yellow-600" />
                  Pièce d'Identité
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="typeIdentite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de pièce d'identité <span className="text-destructive">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
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

              {/* Identity Photos */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  Photos de la Pièce d'Identité
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Recto */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Photo Recto</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {photos.recto ? (
                        <div>
                          <img src={photos.recto} alt="Photo recto" className="mx-auto rounded-lg shadow-md max-h-32" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePhoto('recto')}
                            className="mt-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-3">Aucune photo</p>
                          <Button
                            type="button"
                            onClick={() => handlePhotoCapture('recto')}
                            className="bg-primary text-white hover:bg-primary/90"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Prendre photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo Verso */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Photo Verso</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {photos.verso ? (
                        <div>
                          <img src={photos.verso} alt="Photo verso" className="mx-auto rounded-lg shadow-md max-h-32" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePhoto('verso')}
                            className="mt-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-3">Aucune photo</p>
                          <Button
                            type="button"
                            onClick={() => handlePhotoCapture('verso')}
                            className="bg-primary text-white hover:bg-primary/90"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Prendre photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-success hover:bg-success/90">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Vente'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <CameraModal
        isOpen={camera.isOpen}
        photoType={camera.currentPhotoType}
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        isCapturing={camera.isCapturing}
        onClose={camera.stopCamera}
        onCapture={async () => {
          try {
            const photoData = await camera.capturePhoto();
            if (camera.currentPhotoType) {
              handlePhotoTaken(camera.currentPhotoType, photoData);
            }
            camera.stopCamera();
          } catch (error) {
            toast({
              title: "Erreur",
              description: "Erreur lors de la capture de la photo",
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
