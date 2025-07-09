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
    <div className="min-h-screen flex items-center justify-center bg-background mobile-padding py-4">
      
      <Card className="w-full max-w-md modern-card border border-border">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="modern-icon-container">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">RegisFlow</CardTitle>
            <p className="text-muted-foreground text-sm">Registre des ventes des Feux d'artifice</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-semibold text-foreground">Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Votre nom d'utilisateur" 
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
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-semibold text-foreground">Mot de passe</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Votre mot de passe" 
                        className="modern-input" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full modern-button-primary" 
                disabled={isLoggingIn}
              >
                <LogIn className="h-5 w-5 mr-2" />
                {isLoggingIn ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </Form>
          
          {credentialsStatus?.showDefaultCredentials && (
            <Alert className="status-info border-2 rounded-xl backdrop-blur-sm bg-blue-50/80 fade-in">
              <Info className="h-5 w-5" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold text-blue-900">Compte administrateur par défaut</p>
                  <div className="bg-white/60 p-3 rounded-lg border border-blue-200/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Utilisateur :</span>
                      <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">admin</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Mot de passe :</span>
                      <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">admin123</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-orange-50/80 border border-orange-200/50 rounded-lg">
                    <div className="text-orange-500 mt-0.5">⚠️</div>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      <strong>Important :</strong> Changez ce mot de passe après votre première connexion pour sécuriser l'application.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}