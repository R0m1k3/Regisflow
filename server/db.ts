import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration de connexion avec support Unix socket pour PostgreSQL local
const connectionConfig = {
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  host: '/home/runner/postgres_data/socket',
  port: 5432,
  ssl: false // Désactiver SSL pour PostgreSQL local
};

export const pool = new Pool(connectionConfig);

export const db = drizzle(pool, { schema });