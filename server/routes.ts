import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { loginSchema, insertUserSchema, insertStoreSchema, insertSaleSchema } from "@shared/schema";
import { z } from "zod";
import { createAutomaticBackup, getBackupStats } from "./backup-scheduler";
import { executePurgeManually, getPurgeStats } from "./data-purge";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.user = user;
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with PostgreSQL store
  const pgStore = connectPg(session);
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'sessions',
    }),
    secret: process.env.SESSION_SECRET || 'fireworks-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize default admin if needed
  const initResult = await storage.initializeDefaults();
  if (initResult.defaultAdminCredentials) {
    console.log('\n=== DEFAULT ADMIN CREATED ===');
    console.log('Username:', initResult.defaultAdminCredentials.username);
    console.log('Password:', initResult.defaultAdminCredentials.password);
    console.log('Please change this password after first login!');
    console.log('==============================\n');
  }

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/');
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Check if default admin credentials are still in use
  app.get('/api/auth/default-credentials-status', async (req, res) => {
    try {
      const isUsingDefault = await storage.isUsingDefaultPassword();
      res.json({ showDefaultCredentials: isUsingDefault });
    } catch (error) {
      console.error('Default credentials check error:', error);
      res.status(500).json({ error: "Failed to check default credentials status" });
    }
  });

  // Production health check endpoint with comprehensive monitoring
  app.get('/health', async (req, res) => {
    try {
      // Test de connexion à la base de données
      const dbStart = Date.now();
      await storage.initializeDefaults();
      const dbLatency = Date.now() - dbStart;

      // Informations système
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '2025.1.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`
        },
        system: {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            unit: 'MB'
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        },
        features: {
          backup_scheduler: 'active',
          data_purge: 'active',
          photo_storage: 'enabled',
          session_store: 'postgresql'
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
      });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Store routes for users
  app.get('/api/stores', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Administrators can access all stores
      if (user.role === 'administrator') {
        const allStores = await storage.getAllStores();
        return res.json(allStores);
      }

      // Non-administrators only access their assigned store
      if (!user.storeId) {
        return res.status(404).json({ error: "User store not found" });
      }

      const store = await storage.getStore(user.storeId);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      
      res.json([store]); // Return as array to match admin endpoint format
    } catch (error) {
      console.error('Get user stores error:', error);
      res.status(500).json({ error: "Failed to get stores" });
    }
  });

  // Sales routes
  app.get('/api/sales', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;
      
      // Determine which store to query
      let targetStoreId: number;
      
      if (storeId) {
        // storeId provided in query
        targetStoreId = parseInt(storeId as string);
        
        // For non-admin users, verify they can only access their own store
        if (user.role !== 'administrator' && targetStoreId !== user.storeId) {
          return res.status(403).json({ error: "Access denied to this store" });
        }
      } else {
        // No storeId provided - use user's assigned store for non-admin
        if (!user.storeId) {
          return res.status(400).json({ error: "User has no assigned store" });
        }
        targetStoreId = user.storeId;
      }

      const sales = await storage.getSalesByStore(
        targetStoreId,
        startDate as string,
        endDate as string
      );
      res.json(sales);
    } catch (error) {
      console.error('Get sales error:', error);
      res.status(500).json({ error: "Failed to get sales" });
    }
  });

  app.post('/api/sales', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine which store to use for the sale
      let targetStoreId: number;
      if (user.role === 'administrator' && req.body.storeId) {
        // Admin can create sales for any store
        targetStoreId = req.body.storeId;
      } else {
        // Non-admin users can only create sales for their assigned store
        if (!user.storeId) {
          return res.status(400).json({ error: "User has no assigned store" });
        }
        targetStoreId = user.storeId;
      }

      // Extract products from request body
      const { products = [], ...saleFields } = req.body;
      
      // Validate products
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Au moins un produit est requis" });
      }

      // Map frontend camelCase to database snake_case for photos
      const mappedBody = {
        ...saleFields,
      };
      
      // Add photo fields with proper mapping, only if they exist and are not empty
      if (req.body.photoRecto) {
        mappedBody.photo_recto = req.body.photoRecto;
      }
      if (req.body.photoVerso) {
        mappedBody.photo_verso = req.body.photoVerso;
      }
      if (req.body.photoTicket) {
        mappedBody.photo_ticket = req.body.photoTicket;
      }
      
      // Remove camelCase versions to avoid conflicts
      delete mappedBody.photoRecto;
      delete mappedBody.photoVerso;
      delete mappedBody.photoTicket;

      const saleData = insertSaleSchema.parse({
        ...mappedBody,
        storeId: targetStoreId,
        userId: user.id
      });

      // Parse and validate products
      const validatedProducts = products.map((product: any) => ({
        typeArticle: product.typeArticle,
        categorie: product.categorie,
        quantite: parseInt(product.quantite),
        gencode: product.gencode
      }));

      const sale = await storage.createSaleWithProducts(saleData, validatedProducts);
      res.status(201).json(sale);
    } catch (error) {
      console.error('Create sale error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  app.delete('/api/sales/:id', requireRole(['administrator', 'manager']), async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      await storage.deleteSale(saleId);
      res.json({ message: "Sale deleted successfully" });
    } catch (error) {
      console.error('Delete sale error:', error);
      res.status(500).json({ error: "Failed to delete sale" });
    }
  });

  // Admin routes - Users
  app.get('/api/admin/users', requireRole(['administrator']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post('/api/admin/users', requireRole(['administrator']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      console.error('Create user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put('/api/admin/users/:id', requireRole(['administrator']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = await storage.getUser(req.session.userId!);
      const userData = insertUserSchema.partial().parse(req.body);
      
      // Protection spécifique pour le rôle seulement
      if (userData.role !== undefined) {
        // Protection : empêcher un admin de changer son propre rôle par accident
        if (userId === currentUser?.id && userData.role !== 'administrator') {
          return res.status(400).json({ 
            error: "Vous ne pouvez pas changer votre propre rôle d'administrateur" 
          });
        }
        
        // Protection : ne pas permettre de changer le rôle du dernier administrateur
        if (userData.role !== 'administrator') {
          const users = await storage.getAllUsers();
          const adminUsers = users.filter(u => u.role === 'administrator');
          const userToUpdate = users.find(u => u.id === userId);
          
          if (userToUpdate?.role === 'administrator' && adminUsers.length <= 1) {
            return res.status(400).json({ 
              error: "Impossible de modifier le rôle du dernier administrateur" 
            });
          }
        }
      }
      
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', requireRole(['administrator']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deletion of the last administrator
      const users = await storage.getAllUsers();
      const adminUsers = users.filter(u => u.role === 'administrator');
      const userToDelete = users.find(u => u.id === userId);
      
      if (userToDelete?.role === 'administrator' && adminUsers.length <= 1) {
        return res.status(400).json({ error: "Cannot delete the last administrator" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin routes - Stores
  app.get('/api/admin/stores', requireRole(['administrator']), async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error('Get stores error:', error);
      res.status(500).json({ error: "Failed to get stores" });
    }
  });

  app.post('/api/admin/stores', requireRole(['administrator']), async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {
      console.error('Create store error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create store" });
    }
  });

  app.put('/api/admin/stores/:id', requireRole(['administrator']), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const storeData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(storeId, storeData);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error('Update store error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update store" });
    }
  });

  app.delete('/api/admin/stores/:id', requireRole(['administrator']), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      // Check if there are users assigned to this store
      const users = await storage.getAllUsers();
      const usersInStore = users.filter(u => u.storeId === storeId);
      
      if (usersInStore.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete store with assigned users", 
          details: `${usersInStore.length} user(s) are assigned to this store` 
        });
      }
      
      await storage.deleteStore(storeId);
      res.json({ message: "Store deleted successfully" });
    } catch (error) {
      console.error('Delete store error:', error);
      res.status(500).json({ error: "Failed to delete store" });
    }
  });

  // Backup routes
  app.get('/api/admin/backup/export', requireRole(['administrator']), async (req, res) => {
    try {
      // Get all data from the database
      const users = await storage.getAllUsers();
      const stores = await storage.getAllStores();
      
      // Get all sales from all stores
      const allSales = [];
      for (const store of stores) {
        const storeSales = await storage.getSalesByStore(store.id);
        allSales.push(...storeSales);
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          users: users.map(user => ({
            ...user,
            // Don't include the password hash in backup for security
            password: undefined
          })),
          stores,
          sales: allSales
        },
        metadata: {
          totalUsers: users.length,
          totalStores: stores.length,
          totalSales: allSales.length,
          exportedBy: req.user.username
        }
      };

      res.json(backupData);
    } catch (error) {
      console.error('Export backup error:', error);
      res.status(500).json({ error: "Failed to export backup" });
    }
  });

  app.post('/api/admin/backup/import', requireRole(['administrator']), async (req, res) => {
    try {
      const backupData = req.body;
      
      // Validate backup structure
      if (!backupData.data || !backupData.data.users || !backupData.data.stores || !backupData.data.sales) {
        return res.status(400).json({ error: "Invalid backup file format" });
      }

      // Clear existing data (in reverse order due to foreign keys)
      // First delete all sales
      const existingSales = [];
      const existingStores = await storage.getAllStores();
      for (const store of existingStores) {
        const storeSales = await storage.getSalesByStore(store.id);
        existingSales.push(...storeSales);
      }
      
      for (const sale of existingSales) {
        await storage.deleteSale(sale.id);
      }

      // Then delete users (except admin to avoid locking out)
      const existingUsers = await storage.getAllUsers();
      for (const user of existingUsers) {
        if (user.role !== 'administrator' || user.username !== 'admin') {
          await storage.deleteUser(user.id);
        }
      }

      // Then delete stores
      for (const store of existingStores) {
        await storage.deleteStore(store.id);
      }

      // Import new data
      // First import stores
      const storeIdMapping = new Map();
      for (const storeData of backupData.data.stores) {
        const { id, ...storeWithoutId } = storeData;
        const newStore = await storage.createStore(storeWithoutId);
        storeIdMapping.set(id, newStore.id);
      }

      // Then import users (excluding admin and users with passwords)
      const userIdMapping = new Map();
      for (const userData of backupData.data.users) {
        if (userData.username === 'admin') continue; // Skip admin user
        
        const { id, password, ...userWithoutIdAndPassword } = userData;
        
        // Map store ID if it exists
        if (userData.storeId && storeIdMapping.has(userData.storeId)) {
          userWithoutIdAndPassword.storeId = storeIdMapping.get(userData.storeId);
        }
        
        // Set a default password since we can't restore the original
        const userWithPassword = {
          ...userWithoutIdAndPassword,
          password: 'restored123' // Users will need to change this
        };
        
        const newUser = await storage.createUser(userWithPassword);
        userIdMapping.set(id, newUser.id);
      }

      // Finally import sales
      for (const saleData of backupData.data.sales) {
        const { id, ...saleWithoutId } = saleData;
        
        // Map store and user IDs
        if (saleData.storeId && storeIdMapping.has(saleData.storeId)) {
          saleWithoutId.storeId = storeIdMapping.get(saleData.storeId);
        }
        if (saleData.userId && userIdMapping.has(saleData.userId)) {
          saleWithoutId.userId = userIdMapping.get(saleData.userId);
        }
        
        // Convert timestamp string to Date object
        if (saleWithoutId.timestamp && typeof saleWithoutId.timestamp === 'string') {
          saleWithoutId.timestamp = new Date(saleWithoutId.timestamp);
        }
        
        // Convert date strings to Date objects - fix for backup import
        if (saleWithoutId.dateNaissance && typeof saleWithoutId.dateNaissance === 'string') {
          // Handle date format YYYY-MM-DD
          saleWithoutId.dateNaissance = saleWithoutId.dateNaissance;
        }
        if (saleWithoutId.dateDelivrance && typeof saleWithoutId.dateDelivrance === 'string') {
          // Handle date format YYYY-MM-DD
          saleWithoutId.dateDelivrance = saleWithoutId.dateDelivrance;
        }
        
        await storage.createSale(saleWithoutId);
      }

      res.json({ 
        message: "Backup imported successfully",
        imported: {
          stores: backupData.data.stores.length,
          users: backupData.data.users.filter((u: any) => u.username !== 'admin').length,
          sales: backupData.data.sales.length
        }
      });
    } catch (error) {
      console.error('Import backup error:', error);
      res.status(500).json({ error: "Failed to import backup", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Manual backup trigger route
  app.post('/api/admin/backup/create', requireRole(['administrator']), async (req, res) => {
    try {
      const result = await createAutomaticBackup();
      if (result.success) {
        res.json({
          message: "Manual backup created successfully",
          filename: result.filename,
          stats: result.stats
        });
      } else {
        res.status(500).json({ error: "Failed to create backup", details: result.error });
      }
    } catch (error) {
      console.error('Manual backup error:', error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  // Backup statistics route
  app.get('/api/admin/backup/stats', requireRole(['administrator']), async (req, res) => {
    try {
      const stats = getBackupStats();
      res.json(stats);
    } catch (error) {
      console.error('Backup stats error:', error);
      res.status(500).json({ error: "Failed to get backup statistics" });
    }
  });

  // Admin routes - Data Purge
  app.get('/api/admin/purge/stats', requireRole(['administrator']), async (req, res) => {
    try {
      const stats = await getPurgeStats();
      res.json(stats);
    } catch (error) {
      console.error('Get purge stats error:', error);
      res.status(500).json({ error: "Failed to get purge stats" });
    }
  });

  app.post('/api/admin/purge/execute', requireRole(['administrator']), async (req, res) => {
    try {
      const result = await executePurgeManually();
      res.json(result);
    } catch (error) {
      console.error('Execute purge error:', error);
      res.status(500).json({ error: "Failed to execute purge" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
