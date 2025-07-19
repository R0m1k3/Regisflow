import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Magasins table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table with authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(), // Will be hashed
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("employee"), // admin, manager, employee
  storeId: integer("store_id").references(() => stores.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales table - Informations générales de la vente
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  
  // Vendeur
  vendeur: varchar("vendeur", { length: 255 }).notNull(),
  
  // Client
  nom: varchar("nom", { length: 255 }).notNull(),
  prenom: varchar("prenom", { length: 255 }).notNull(),
  dateNaissance: varchar("date_naissance", { length: 10 }).notNull(),
  lieuNaissance: varchar("lieu_naissance", { length: 255 }),
  modePaiement: varchar("mode_paiement", { length: 50 }).notNull().default("Espèce"),
  
  // Identité
  typeIdentite: varchar("type_identite", { length: 50 }).notNull(),
  numeroIdentite: varchar("numero_identite", { length: 100 }).notNull(),
  autoriteDelivrance: varchar("autorite_delivrance", { length: 255 }),
  dateDelivrance: varchar("date_delivrance", { length: 10 }).notNull(),
  
  // Photos
  photo_recto: text("photo_recto"),
  photo_verso: text("photo_verso"),
  photo_ticket: text("photo_ticket"),
});

// Table des produits vendus (nouveau)
export const saleProducts = pgTable("sale_products", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  typeArticle: varchar("type_article", { length: 255 }).notNull(),
  categorie: varchar("categorie", { length: 2 }).notNull(),
  quantite: integer("quantite").notNull(),
  gencode: varchar("gencode", { length: 13 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  users: many(users),
  sales: many(sales),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.storeId],
    references: [stores.id],
  }),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  store: one(stores, {
    fields: [sales.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  products: many(saleProducts),
}));

export const saleProductsRelations = relations(saleProducts, ({ one }) => ({
  sale: one(sales, {
    fields: [saleProducts.saleId],
    references: [sales.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  timestamp: true,
});

export const insertSaleProductSchema = createInsertSchema(saleProducts).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
export type SaleProduct = typeof saleProducts.$inferSelect;
export type InsertSaleProduct = typeof saleProducts.$inferInsert;
export type LoginData = z.infer<typeof loginSchema>;
