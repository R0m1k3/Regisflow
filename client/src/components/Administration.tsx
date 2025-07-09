import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, insertStoreSchema, type User, type Store } from "@shared/schema";
import { Users, Building2, Plus, Edit, Trash2, Settings } from "lucide-react";
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
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier l'utilisateur", variant: "destructive" });
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

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      await deleteUserMutation.mutateAsync(user.id);
    }
  };

  const handleDeleteStore = async (store: Store) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le magasin "${store.name}" ?`)) {
      await deleteStoreMutation.mutateAsync(store.id);
    }
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.role === 'administrator'}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rôle</FormLabel>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStore(store)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}