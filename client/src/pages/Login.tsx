import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginData } from "@shared/schema";
import { LogIn, Sparkles, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();

  // Check if default credentials should be shown
  const { data: credentialsStatus } = useQuery({
    queryKey: ['/api/auth/default-credentials-status'],
    queryFn: async () => {
      const response = await apiRequest('/api/auth/default-credentials-status');
      return response.json();
    },
  });

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      await login(data);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application !",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Registre des Ventes</CardTitle>
          <p className="text-muted-foreground">Connectez-vous pour accéder à l'application</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom d'utilisateur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                <LogIn className="h-4 w-4 mr-2" />
                {isLoggingIn ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
          
          {credentialsStatus?.showDefaultCredentials && (
            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Compte administrateur par défaut :</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Utilisateur :</strong> admin</p>
                    <p><strong>Mot de passe :</strong> admin123</p>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Changez ce mot de passe après votre première connexion pour sécuriser l'application.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}