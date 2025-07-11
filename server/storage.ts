import {
  users,
  stores,
  sales,
  type User,
  type InsertUser,
  type Store,
  type InsertStore,
  type Sale,
  type InsertSale,
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
  createSale(sale: InsertSale): Promise<Sale>;
  getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sale[]>;
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

  async createSale(saleData: InsertSale): Promise<Sale> {
    const [sale] = await db
      .insert(sales)
      .values(saleData)
      .returning();
    return sale;
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
    
    return await query.orderBy(desc(sales.timestamp));
  }

  async deleteSale(id: number): Promise<void> {
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
        role: "admin",
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

export const storage = new DatabaseStorage();
