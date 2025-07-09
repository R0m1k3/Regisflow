import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { loginSchema, insertUserSchema, insertStoreSchema, insertSaleSchema } from "@shared/schema";
import { z } from "zod";

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

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
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
      if (!user || !user.storeId) {
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
        if (user.role !== 'admin' && targetStoreId !== user.storeId) {
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
      if (user.role === 'admin' && req.body.storeId) {
        // Admin can create sales for any store
        targetStoreId = req.body.storeId;
      } else {
        // Non-admin users can only create sales for their assigned store
        if (!user.storeId) {
          return res.status(400).json({ error: "User has no assigned store" });
        }
        targetStoreId = user.storeId;
      }

      const saleData = insertSaleSchema.parse({
        ...req.body,
        storeId: targetStoreId,
        userId: user.id
      });

      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error) {
      console.error('Create sale error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  app.delete('/api/sales/:id', requireRole(['admin', 'manager']), async (req, res) => {
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
  app.get('/api/admin/users', requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post('/api/admin/users', requireRole(['admin']), async (req, res) => {
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

  app.put('/api/admin/users/:id', requireRole(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
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

  app.delete('/api/admin/users/:id', requireRole(['admin']), async (req, res) => {
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
  app.get('/api/admin/stores', requireRole(['admin']), async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error('Get stores error:', error);
      res.status(500).json({ error: "Failed to get stores" });
    }
  });

  app.post('/api/admin/stores', requireRole(['admin']), async (req, res) => {
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

  app.put('/api/admin/stores/:id', requireRole(['admin']), async (req, res) => {
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

  app.delete('/api/admin/stores/:id', requireRole(['admin']), async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
