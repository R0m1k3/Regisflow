import {
  users,
  stores,
  sales,
  saleProducts,
  type User,
  type InsertUser,
  type Store,
  type InsertStore,
  type Sale,
  type InsertSale,
  type SaleProduct,
  type InsertSaleProduct,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  getAllStores(): Promise<Store[]>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<void>;
  
  // Sale operations
  getSale(id: number): Promise<Sale | undefined>;
  createSaleWithProducts(sale: InsertSale, products: InsertSaleProduct[]): Promise<Sale>;
  getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sale[]>;
  getSaleWithProducts(id: number): Promise<(Sale & { products: SaleProduct[] }) | undefined>;
  deleteSale(id: number): Promise<void>;
  
  // Auth operations
  authenticateUser(username: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  initializeDefaults(): Promise<{ defaultAdminCredentials?: { username: string; password: string } }>;
  isUsingDefaultPassword(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    // Convert empty email to null to avoid unique constraint issues
    if (userData.email === "") {
      userData.email = null;
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    // Convert empty email to null to avoid unique constraint issues
    if (userData.email === "") {
      userData.email = null;
    }
    
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(storeData)
      .returning();
    return store;
  }

  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores).orderBy(desc(stores.createdAt));
  }

  async updateStore(id: number, storeData: Partial<InsertStore>): Promise<Store | undefined> {
    const [store] = await db
      .update(stores)
      .set(storeData)
      .where(eq(stores.id, id))
      .returning();
    return store;
  }

  async deleteStore(id: number): Promise<void> {
    await db.delete(stores).where(eq(stores.id, id));
  }

  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async createSaleWithProducts(saleData: InsertSale, products: InsertSaleProduct[]): Promise<Sale> {
    // Use transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Create the sale first
      const [sale] = await tx
        .insert(sales)
        .values(saleData)
        .returning();

      // Create all products for this sale
      if (products.length > 0) {
        await tx
          .insert(saleProducts)
          .values(products.map(product => ({
            ...product,
            saleId: sale.id
          })));
      }

      return sale;
    });
  }

  async getSaleWithProducts(id: number): Promise<(Sale & { products: SaleProduct[] }) | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const products = await db.select().from(saleProducts).where(eq(saleProducts.saleId, id));
    return { ...sale, products };
  }

  async getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = db.select().from(sales).where(eq(sales.storeId, storeId));
    
    if (startDate && endDate) {
      // Convert dates to timestamp format for comparison
      const startTimestamp = new Date(startDate + 'T00:00:00').toISOString();
      const endTimestamp = new Date(endDate + 'T23:59:59').toISOString();
      
      query = db.select().from(sales).where(
        and(
          eq(sales.storeId, storeId),
          gte(sales.timestamp, startTimestamp),
          lte(sales.timestamp, endTimestamp)
        )
      );
    }
    
    const salesData = await query.orderBy(desc(sales.timestamp));
    
    // Get products for each sale and map photo column names correctly
    const salesWithProducts = await Promise.all(
      salesData.map(async (sale) => {
        const products = await db.select().from(saleProducts).where(eq(saleProducts.saleId, sale.id));
        
        // Map photo column names from snake_case to camelCase
        const mappedSale = {
          ...sale,
          photoRecto: sale.photo_recto,
          photoVerso: sale.photo_verso,
          photoTicket: sale.photo_ticket,
          products
        };
        
        return mappedSale;
      })
    );
    
    return salesWithProducts;
  }

  async getAllSales(storeId?: number): Promise<any[]> {
    // Récupérer les ventes avec leurs produits
    const query = db
      .select({
        // Sale fields
        id: sales.id,
        storeId: sales.storeId,
        userId: sales.userId,
        timestamp: sales.timestamp,
        vendeur: sales.vendeur,
        nom: sales.nom,
        prenom: sales.prenom,
        dateNaissance: sales.dateNaissance,
        lieuNaissance: sales.lieuNaissance,
        modePaiement: sales.modePaiement,
        typeIdentite: sales.typeIdentite,
        numeroIdentite: sales.numeroIdentite,
        autoriteDelivrance: sales.autoriteDelivrance,
        dateDelivrance: sales.dateDelivrance,
        photoRecto: sales.photo_recto,
        photoVerso: sales.photo_verso,
        photoTicket: sales.photo_ticket,
        // Product fields
        productId: saleProducts.id,
        typeArticle: saleProducts.typeArticle,
        categorie: saleProducts.categorie,
        quantite: saleProducts.quantite,
        gencode: saleProducts.gencode
      })
      .from(sales)
      .leftJoin(saleProducts, eq(sales.id, saleProducts.saleId));
    
    if (storeId) {
      const results = await query.where(eq(sales.storeId, storeId)).orderBy(desc(sales.timestamp));
      return this.groupSalesByProducts(results);
    }
    
    const results = await query.orderBy(desc(sales.timestamp));
    return this.groupSalesByProducts(results);
  }

  private groupSalesByProducts(results: any[]): any[] {
    const salesMap = new Map();
    
    results.forEach(row => {
      if (!salesMap.has(row.id)) {
        salesMap.set(row.id, {
          id: row.id,
          storeId: row.storeId,
          userId: row.userId,
          timestamp: row.timestamp,
          vendeur: row.vendeur,
          nom: row.nom,
          prenom: row.prenom,
          dateNaissance: row.dateNaissance,
          lieuNaissance: row.lieuNaissance,
          modePaiement: row.modePaiement,
          typeIdentite: row.typeIdentite,
          numeroIdentite: row.numeroIdentite,
          autoriteDelivrance: row.autoriteDelivrance,
          dateDelivrance: row.dateDelivrance,
          photoRecto: row.photoRecto,
          photoVerso: row.photoVerso,
          photoTicket: row.photoTicket,
          products: []
        });
      }
      
      // Ajouter le produit s'il existe
      if (row.productId) {
        salesMap.get(row.id).products.push({
          id: row.productId,
          typeArticle: row.typeArticle,
          categorie: row.categorie,
          quantite: row.quantite,
          gencode: row.gencode
        });
      }
    });
    
    const result = Array.from(salesMap.values());
    return result;
  }

  async deleteSale(id: number): Promise<void> {
    // Delete sale products first (cascade should handle this, but being explicit)
    await db.delete(saleProducts).where(eq(saleProducts.saleId, id));
    await db.delete(sales).where(eq(sales.id, id));
  }

  // Auth operations
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Check if admin still uses default password
  async isUsingDefaultPassword(): Promise<boolean> {
    const adminUser = await this.getUserByUsername('admin');
    if (!adminUser) {
      return false;
    }
    
    // Check if the stored password hash matches the default password "admin123"
    return await bcrypt.compare('admin123', adminUser.password);
  }

  // Initialize default admin user and store if none exist
  async initializeDefaults(): Promise<{ defaultAdminCredentials?: { username: string; password: string } }> {
    const existingUsers = await this.getAllUsers();
    
    // FORCE ADMIN ROLE CORRECTION - Production fix
    const adminUsers = existingUsers.filter(u => u.username === 'admin');
    for (const adminUser of adminUsers) {
      if (adminUser.role !== 'administrator') {
        console.log(`🔧 FIXING ADMIN ROLE: User ID ${adminUser.id} role "${adminUser.role}" -> "administrator"`);
        await db.update(users)
          .set({ role: 'administrator' })
          .where(eq(users.id, adminUser.id));
      }
    }
    
    if (existingUsers.length === 0) {
      // Create default store
      const defaultStore = await this.createStore({
        name: "Magasin Principal",
        address: "À définir",
        isActive: true,
      });

      // Create default admin user
      const defaultPassword = "admin123";
      const adminUser = await this.createUser({
        username: "admin",
        password: defaultPassword,
        email: "admin@example.com",
        firstName: "Administrateur",
        lastName: "Principal",
        role: "administrator",
        storeId: defaultStore.id,
        isActive: true,
      });

      return {
        defaultAdminCredentials: {
          username: "admin",
          password: defaultPassword
        }
      };
    }
    
    return {};
  }
}

class MemStorage implements IStorage {
  private users: User[] = [];
  private stores: Store[] = [];
  private sales: Sale[] = [];
  private saleProducts: SaleProduct[] = [];
  private nextUserId = 1;
  private nextStoreId = 1;
  private nextSaleId = 1;
  private nextSaleProductId = 1;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    // Convert empty email to null to avoid unique constraint issues
    if (userData.email === "") {
      userData.email = null;
    }
    
    const user: User = {
      ...userData,
      id: this.nextUserId++,
      email: userData.email || null,
      isActive: userData.isActive || true,
      updatedAt: null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      storeId: userData.storeId || null,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    // Convert empty email to null to avoid unique constraint issues
    if (userData.email === "") {
      userData.email = null;
    }
    
    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async deleteUser(id: number): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.find(s => s.id === id);
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const store: Store = {
      ...storeData,
      id: this.nextStoreId++,
      address: storeData.address || null,
      phone: storeData.phone || null,
      email: storeData.email || null,
      isActive: storeData.isActive || true,
      updatedAt: null,
      createdAt: new Date(),
    };
    this.stores.push(store);
    return store;
  }

  async getAllStores(): Promise<Store[]> {
    return [...this.stores].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateStore(id: number, storeData: Partial<InsertStore>): Promise<Store | undefined> {
    const storeIndex = this.stores.findIndex(s => s.id === id);
    if (storeIndex === -1) return undefined;
    
    this.stores[storeIndex] = { ...this.stores[storeIndex], ...storeData };
    return this.stores[storeIndex];
  }

  async deleteStore(id: number): Promise<void> {
    this.stores = this.stores.filter(s => s.id !== id);
  }

  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.find(s => s.id === id);
  }

  async createSaleWithProducts(sale: InsertSale, products: InsertSaleProduct[]): Promise<Sale> {
    const newSale: Sale = {
      ...sale,
      id: this.nextSaleId++,
      timestamp: new Date(),
      lieuNaissance: sale.lieuNaissance || null,
      autoriteDelivrance: sale.autoriteDelivrance || null,
      // Map typeIdentite to documentType field for historical reasons
      documentType: sale.typeIdentite || null,
      // Map numeroIdentite to documentNumber field  
      documentNumber: sale.numeroIdentite || null,
      // Ensure adresse is properly mapped
      adresse: sale.adresse || null,
      photoRecto: sale.photoRecto || null,
      photoVerso: sale.photoVerso || null,
      photo_ticket: sale.photo_ticket || null,
    };
    this.sales.push(newSale);

    // Create sale products
    for (const product of products) {
      const saleProduct: SaleProduct = {
        ...product,
        id: this.nextSaleProductId++,
        saleId: newSale.id,
        createdAt: null,
      };
      this.saleProducts.push(saleProduct);
    }

    return newSale;
  }

  async getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sale[]> {
    let filteredSales = this.sales.filter(s => s.storeId === storeId);
    
    if (startDate) {
      const start = new Date(startDate);
      filteredSales = filteredSales.filter(s => s.timestamp && s.timestamp >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filteredSales = filteredSales.filter(s => s.timestamp && s.timestamp <= end);
    }
    
    return filteredSales.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getSaleWithProducts(id: number): Promise<(Sale & { products: SaleProduct[] }) | undefined> {
    const sale = await this.getSale(id);
    if (!sale) return undefined;
    
    const products = this.saleProducts.filter(sp => sp.saleId === id);
    return { ...sale, products };
  }

  async deleteSale(id: number): Promise<void> {
    this.saleProducts = this.saleProducts.filter(sp => sp.saleId !== id);
    this.sales = this.sales.filter(s => s.id !== id);
  }

  // Auth operations
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Check if admin still uses default password
  async isUsingDefaultPassword(): Promise<boolean> {
    const adminUser = await this.getUserByUsername('admin');
    if (!adminUser) {
      return false;
    }
    
    // Check if the stored password hash matches the default password "admin123"
    return await bcrypt.compare('admin123', adminUser.password);
  }

  // Initialize default admin user and store if none exist
  async initializeDefaults(): Promise<{ defaultAdminCredentials?: { username: string; password: string } }> {
    const existingUsers = await this.getAllUsers();
    
    if (existingUsers.length === 0) {
      // Create default store
      const defaultStore = await this.createStore({
        name: "Magasin Principal",
        address: "À définir",
        isActive: true,
      });

      // Create default admin user
      const defaultPassword = "admin123";
      const adminUser = await this.createUser({
        username: "admin",
        password: defaultPassword,
        email: "admin@example.com",
        firstName: "Administrateur",
        lastName: "Principal",
        role: "administrator",
        storeId: defaultStore.id,
        isActive: true,
      });

      return {
        defaultAdminCredentials: {
          username: "admin",
          password: defaultPassword
        }
      };
    }
    
    return {};
  }
}

// Add methods for backup and purge functionality
class MemStorageWithBackup extends MemStorage {
  // Backup/export functionality 
  async exportData() {
    return {
      users: this.users.map(u => ({ ...u, password: undefined })), // Exclude passwords
      stores: this.stores,
      sales: this.sales,
      saleProducts: this.saleProducts
    };
  }
  
  // Import/restore functionality
  async importData(data: any) {
    if (data.users) this.users = data.users;
    if (data.stores) this.stores = data.stores;
    if (data.sales) this.sales = data.sales;
    if (data.saleProducts) this.saleProducts = data.saleProducts;
    
    // Update counters to avoid ID conflicts
    this.nextUserId = Math.max(...this.users.map(u => u.id), 0) + 1;
    this.nextStoreId = Math.max(...this.stores.map(s => s.id), 0) + 1;
    this.nextSaleId = Math.max(...this.sales.map(s => s.id), 0) + 1;
    this.nextSaleProductId = Math.max(...this.saleProducts.map(sp => sp.id), 0) + 1;
  }
  
  // Purge old sales data (19 months+)
  async purgeOldSales(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 19);
    
    const oldSalesCount = this.sales.filter(s => s.timestamp && s.timestamp < cutoffDate).length;
    
    // Remove old sales and their products
    const oldSaleIds = this.sales
      .filter(s => s.timestamp && s.timestamp < cutoffDate)
      .map(s => s.id);
    
    this.sales = this.sales.filter(s => !s.timestamp || s.timestamp >= cutoffDate);
    this.saleProducts = this.saleProducts.filter(sp => !oldSaleIds.includes(sp.saleId));
    
    return { deletedCount: oldSalesCount };
  }
  
  // Get purge statistics
  async getPurgeStats() {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 19);
    
    const totalSales = this.sales.length;
    const oldSales = this.sales.filter(s => s.timestamp && s.timestamp < cutoffDate).length;
    
    return {
      totalSales,
      oldSales,
      cutoffDate: cutoffDate.toISOString()
    };
  }
}

// Use in-memory storage with backup functionality for now
export const storage = new MemStorageWithBackup();
