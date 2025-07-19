import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration de connexion avec SSL désactivé pour Docker local
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: false // Désactiver SSL pour production Docker locale
};

// Si DATABASE_URL contient déjà sslmode=disable, ne pas forcer SSL
if (process.env.DATABASE_URL?.includes('sslmode=disable')) {
  connectionConfig.ssl = false;
} else if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost')) {
  // Activer SSL uniquement pour production externe (pas Docker local)
  connectionConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(connectionConfig);

export const db = drizzle(pool, { schema });