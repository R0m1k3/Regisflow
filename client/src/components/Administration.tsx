import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, insertStoreSchema, type User, type Store } from "@shared/schema";
import { Users, Building2, Plus, Edit, Trash2, Settings, Download, Upload, Database, Clock, Calendar } from "lucide-react";
import { z } from "zod";

const createUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const editUserSchema = insertUserSchema.partial().extend({
  id: z.number(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const editStoreSchema = insertStoreSchema.extend({
  id: z.number(),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;
type EditStoreData = z.infer<typeof editStoreSchema>;

export default function Administration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Get current user info to prevent self-role modification
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('/api/auth/me');
      return response.json();
    },
  });

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/users');
      return response.json();
    },
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ['/api/admin/stores'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/stores');
      return response.json();
    },
  });

  const { data: backupStats } = useQuery({
    queryKey: ['/api/admin/backup/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/backup/stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: purgeStats } = useQuery({
    queryKey: ['/api/admin/purge/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/purge/stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { confirmPassword, ...data } = userData;
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUserDialogOpen(false);
      userForm.reset();
      toast({ title: "Utilisateur créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer l'utilisateur", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: EditUserData) => {
      const { id, confirmPassword, ...data } = userData;
      const response = await apiRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      editUserForm.reset();
      toast({ title: "Utilisateur modifié avec succès" });
    },
    onError: (error) => {
      let errorMessage = "Impossible de modifier l'utilisateur";
      if (error.message.includes("Vous ne pouvez pas changer votre propre rôle")) {
        errorMessage = "Vous ne pouvez pas changer votre propre rôle d'administrateur";
      } else if (error.message.includes("Impossible de modifier le rôle du dernier administrateur")) {
        errorMessage = "Impossible de modifier le rôle du dernier administrateur";
      }
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Utilisateur supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur", variant: "destructive" });
    },
  });

  // Store mutations
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: z.infer<typeof insertStoreSchema>) => {
      const response = await apiRequest('/api/admin/stores', {
        method: 'POST',
        body: JSON.stringify(storeData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsStoreDialogOpen(false);
      storeForm.reset();
      toast({ title: "Magasin créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le magasin", variant: "destructive" });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (storeData: EditStoreData) => {
      const { id, ...data } = storeData;
      const response = await apiRequest(`/api/admin/stores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setEditingStore(null);
      editStoreForm.reset();
      toast({ title: "Magasin modifié avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le magasin", variant: "destructive" });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      await apiRequest(`/api/admin/stores/${storeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      toast({ title: "Magasin supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le magasin", variant: "destructive" });
    },
  });

  // Forms
  const userForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "employee",
      storeId: undefined,
      isActive: true,
    },
  });

  const editUserForm = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
  });

  const storeForm = useForm<z.infer<typeof insertStoreSchema>>({
    resolver: zodResolver(insertStoreSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    },
  });

  const editStoreForm = useForm<EditStoreData>({
    resolver: zodResolver(editStoreSchema),
  });

  // Handlers
  const onCreateUser = async (data: CreateUserData) => {
    await createUserMutation.mutateAsync(data);
  };

  const onEditUser = async (data: EditUserData) => {
    await updateUserMutation.mutateAsync(data);
  };

  const onCreateStore = async (data: z.infer<typeof insertStoreSchema>) => {
    await createStoreMutation.mutateAsync(data);
  };

  const onEditStore = async (data: EditStoreData) => {
    await updateStoreMutation.mutateAsync(data);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editUserForm.reset({
      id: user.id,
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      storeId: user.storeId || undefined,
      isActive: user.isActive,
      password: "",
      confirmPassword: "",
    });
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    editStoreForm.reset({
      id: store.id,
      name: store.name,
      address: store.address || "",
      phone: store.phone || "",
      email: store.email || "",
      isActive: store.isActive,
    });
  };

  const handleDeleteUser = (user: User) => {
    deleteUserMutation.mutate(user.id);
  };

  const handleDeleteStore = (store: Store) => {
    deleteStoreMutation.mutate(store.id);
  };

  // Backup mutations
  const exportBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/backup/export');
      return response.json();
    },
    onSuccess: (data) => {
      // Créer et télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sauvegarde exportée",
        description: "Le fichier de sauvegarde a été téléchargé",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const importBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const response = await apiRequest('/api/admin/backup/import', {
        method: 'POST',
        body: JSON.stringify(backupData),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalider toutes les queries pour forcer un refresh
      queryClient.clear();
      toast({
        title: "Sauvegarde importée",
        description: "Les données ont été restaurées avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'importer la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const createManualBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/backup/create', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup/stats'] });
      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde automatique créée: ${data.filename}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de créer la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const handleExportBackup = () => {
    exportBackupMutation.mutate();
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const backupData = JSON.parse(e.target?.result as string);
            importBackupMutation.mutate(backupData);
          } catch (error) {
            toast({
              title: "Erreur",
              description: "Fichier de sauvegarde invalide",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const executePurgeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/purge/execute', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/purge/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({ 
        title: "Purge exécutée avec succès", 
        description: result.message || `${result.deletedCount} vente(s) supprimée(s)`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de purge",
        description: error.message || "Impossible d'exécuter la purge",
        variant: "destructive",
      });
    },
  });

  const handleExecutePurge = () => {
    executePurgeMutation.mutate();
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      administrator: "destructive" as const,
      manager: "default" as const,
      employee: "secondary" as const,
    };
    const labels = {
      administrator: "Administrateur",
      manager: "Manager",
      employee: "Employé",
    };
    return (
      <Badge variant={variants[role as keyof typeof variants] || "secondary"}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Administration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="stores">Magasins</TabsTrigger>
            <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
            <TabsTrigger value="purge">Purge</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs
              </h3>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouvel utilisateur au système
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom d'utilisateur *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mot de passe *</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmer le mot de passe *</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rôle *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="employee">Employé</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="administrator">Administrateur</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="storeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Magasin</FormLabel>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un magasin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {stores.map((store) => (
                                    <SelectItem key={store.id} value={store.id.toString()}>
                                      {store.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {usersLoading ? (
              <div>Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Magasin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {(user.firstName || user.lastName) && (
                            <div className="text-sm text-muted-foreground">
                              {user.firstName} {user.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {stores.find(s => s.id === user.storeId)?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={user.role === 'administrator'}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer l'utilisateur "{user.username}" ? Cette action est irréversible.
                                  <br /><br />
                                  <strong>Nom complet :</strong> {user.firstName} {user.lastName}<br />
                                  <strong>Email :</strong> {user.email || "Non renseigné"}<br />
                                  <strong>Rôle :</strong> {user.role}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier l'utilisateur</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de l'utilisateur
                  </DialogDescription>
                </DialogHeader>
                {editingUser && (
                  <Form {...editUserForm}>
                    <form onSubmit={editUserForm.handleSubmit(onEditUser)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editUserForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom d'utilisateur</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editUserForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editUserForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editUserForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editUserForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nouveau mot de passe (optionnel)</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editUserForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmer le mot de passe</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editUserForm.control}
                          name="role"
                          render={({ field }) => {
                            const isEditingSelf = editingUser?.id === currentUser?.id;
                            return (
                              <FormItem>
                                <FormLabel>Rôle</FormLabel>
                                <Select 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                  disabled={isEditingSelf}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="employee">Employé</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="administrator">Administrateur</SelectItem>
                                  </SelectContent>
                                </Select>
                                {isEditingSelf && (
                                  <p className="text-sm text-muted-foreground">
                                    Vous ne pouvez pas modifier votre propre rôle
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={editUserForm.control}
                          name="storeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Magasin</FormLabel>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un magasin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {stores.map((store) => (
                                    <SelectItem key={store.id} value={store.id.toString()}>
                                      {store.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={updateUserMutation.isPending}>
                          {updateUserMutation.isPending ? "Modification..." : "Modifier"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestion des Magasins
              </h3>
              <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Magasin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau magasin</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau magasin au système
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...storeForm}>
                    <form onSubmit={storeForm.handleSubmit(onCreateStore)} className="space-y-4">
                      <FormField
                        control={storeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du magasin *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storeForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={storeForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={storeForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsStoreDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createStoreMutation.isPending}>
                          {createStoreMutation.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {storesLoading ? (
              <div>Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.address || "-"}</TableCell>
                      <TableCell>{store.phone || "-"}</TableCell>
                      <TableCell>{store.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={store.isActive ? "default" : "secondary"}>
                          {store.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStore(store)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le magasin "{store.name}" ? Cette action est irréversible.
                                  <br /><br />
                                  <strong>Adresse :</strong> {store.address || "Non renseignée"}<br />
                                  <strong>Téléphone :</strong> {store.phone || "Non renseigné"}<br />
                                  <strong>Email :</strong> {store.email || "Non renseigné"}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStore(store)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Edit Store Dialog */}
            <Dialog open={!!editingStore} onOpenChange={(open) => !open && setEditingStore(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le magasin</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations du magasin
                  </DialogDescription>
                </DialogHeader>
                {editingStore && (
                  <Form {...editStoreForm}>
                    <form onSubmit={editStoreForm.handleSubmit(onEditStore)} className="space-y-4">
                      <FormField
                        control={editStoreForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du magasin</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editStoreForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editStoreForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editStoreForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setEditingStore(null)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={updateStoreMutation.isPending}>
                          {updateStoreMutation.isPending ? "Modification..." : "Modifier"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestion des Sauvegardes
              </h3>
            </div>

            {/* Automatic Backup Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sauvegarde Automatique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {backupStats?.totalBackups || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Sauvegardes disponibles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12h</div>
                    <div className="text-sm text-muted-foreground">Intervalle automatique</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">10</div>
                    <div className="text-sm text-muted-foreground">Maximum conservées</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Prochaine sauvegarde automatique : 00:00 ou 12:00</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => createManualBackupMutation.mutate()}
                    disabled={createManualBackupMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {createManualBackupMutation.isPending ? "Création en cours..." : "Créer une Sauvegarde Manuelle"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Backup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exporter la Base de Données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une sauvegarde complète de toutes les données (utilisateurs, magasins, ventes).
                  </p>
                  <Button 
                    onClick={handleExportBackup} 
                    disabled={exportBackupMutation.isPending}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportBackupMutation.isPending ? "Export en cours..." : "Télécharger la Sauvegarde"}
                  </Button>
                </CardContent>
              </Card>

              {/* Import Backup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importer une Sauvegarde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Restaurez les données à partir d'un fichier de sauvegarde. 
                    <strong className="text-red-600"> Attention : cette action remplacera toutes les données existantes.</strong>
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        disabled={importBackupMutation.isPending}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {importBackupMutation.isPending ? "Import en cours..." : "Restaurer depuis un Fichier"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir restaurer les données depuis un fichier de sauvegarde ?
                          <br /><br />
                          <strong className="text-red-600">
                            ⚠️ ATTENTION : Cette action supprimera définitivement toutes les données actuelles 
                            (utilisateurs, magasins, ventes) et les remplacera par celles du fichier de sauvegarde.
                          </strong>
                          <br /><br />
                          Cette action est irréversible. Assurez-vous d'avoir une sauvegarde des données actuelles 
                          si vous souhaitez pouvoir les récupérer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleImportBackup}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirmer la Restauration
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>Informations sur les Sauvegardes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Sauvegarde automatique :</strong> Le système crée automatiquement une sauvegarde toutes les 12 heures (00:00 et 12:00) et conserve les 10 plus récentes.
                  </div>
                  <div>
                    <strong>Format des fichiers :</strong> Les sauvegardes sont au format JSON et contiennent toutes les données de l'application.
                  </div>
                  <div>
                    <strong>Contenu inclus :</strong> Utilisateurs, magasins, ventes, et toutes les relations entre ces données.
                  </div>
                  <div>
                    <strong>Sécurité :</strong> Les mots de passe sont hachés et ne peuvent pas être récupérés depuis une sauvegarde.
                  </div>
                  <div>
                    <strong>Recommandation :</strong> Les sauvegardes automatiques couvrent la plupart des besoins, mais vous pouvez créer des sauvegardes manuelles avant des modifications importantes.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Purge Tab */}
          <TabsContent value="purge" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Purge des Données
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Statistiques de Purge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total des ventes :</span>
                    <span className="font-medium">{purgeStats?.totalSales || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ventes anciennes (&gt;19 mois) :</span>
                    <span className="font-medium text-orange-600">{purgeStats?.oldSales || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date limite :</span>
                    <span className="font-medium text-xs">
                      {purgeStats?.cutoffDate ? new Date(purgeStats.cutoffDate).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${purgeStats?.purgeEligible ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      <span className="text-sm">
                        {purgeStats?.purgeEligible ? 'Purge nécessaire' : 'Aucune purge nécessaire'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Purge Automatique</h4>
                    <p className="text-xs text-muted-foreground">
                      Exécutée automatiquement le 1er de chaque mois à 02:00
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Rétention des Données</h4>
                    <p className="text-xs text-muted-foreground">
                      19 mois maximum (conforme à la réglementation)
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full"
                          disabled={!purgeStats?.purgeEligible || executePurgeMutation.isPending}
                        >
                          {executePurgeMutation.isPending ? 'Purge en cours...' : 'Exécuter Purge Manuelle'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la Purge</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action va supprimer définitivement {purgeStats?.oldSales || 0} vente(s) 
                            datant de plus de 19 mois. Cette opération est irréversible.
                            <br/><br/>
                            <strong>Ventes concernées :</strong> antérieures au {purgeStats?.cutoffDate ? new Date(purgeStats.cutoffDate).toLocaleDateString('fr-FR') : '-'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleExecutePurge} className="bg-destructive hover:bg-destructive/90">
                            Confirmer la Purge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Information sur la Purge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-sm text-blue-900 mb-2">📋 Réglementation</h4>
                  <p className="text-xs text-blue-700">
                    Les données de ventes de feux d'artifice doivent être conservées pendant 19 mois maximum 
                    conformément à la réglementation française sur les articles pyrotechniques.
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <h4 className="font-medium text-sm text-green-900 mb-2">🔄 Automatisation</h4>
                  <p className="text-xs text-green-700">
                    La purge s'exécute automatiquement chaque mois pour maintenir la conformité. 
                    Vous pouvez également l'exécuter manuellement si nécessaire.
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-sm text-orange-900 mb-2">⚠️ Attention</h4>
                  <p className="text-xs text-orange-700">
                    La purge supprime définitivement les données. Assurez-vous d'avoir effectué 
                    une sauvegarde récente avant d'exécuter une purge manuelle.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}