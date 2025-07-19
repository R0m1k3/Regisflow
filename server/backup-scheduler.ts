import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10;

// Database connection info from environment variables
const DB_HOST = process.env.PGHOST || 'localhost';
const DB_PORT = process.env.PGPORT || '5432';
const DB_NAME = process.env.PGDATABASE || 'postgres';
const DB_USER = process.env.PGUSER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || '';
const DATABASE_URL = process.env.DATABASE_URL;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createAutomaticBackup() {
  try {
    console.log('Creating automatic SQL backup...');
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto-backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Create SQL dump using pg_dump
    await createSQLBackup(filepath);
    
    // Get stats for logging
    const users = await storage.getAllUsers();
    const stores = await storage.getAllStores();
    let totalSales = 0;
    for (const store of stores) {
      const storeSales = await storage.getSalesByStore(store.id);
      totalSales += storeSales.length;
    }
    
    console.log(`✅ Automatic SQL backup created: ${filename}`);
    console.log(`📊 Backup stats: ${users.length} users, ${stores.length} stores, ${totalSales} sales`);

    // Clean up old backups
    await cleanupOldBackups();
    
    return { 
      success: true, 
      filename, 
      stats: {
        totalUsers: users.length,
        totalStores: stores.length,
        totalSales: totalSales,
        exportedBy: 'system-auto-backup'
      }
    };
  } catch (error) {
    console.error('❌ Failed to create automatic SQL backup:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createSQLBackup(filepath: string): Promise<void> {
  try {
    // Use pg_dump to create SQL backup
    let command: string;
    
    if (DATABASE_URL) {
      // Use DATABASE_URL if available
      command = `pg_dump "${DATABASE_URL}" --no-owner --no-privileges --clean --if-exists`;
    } else {
      // Use individual connection parameters
      command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-privileges --clean --if-exists`;
    }
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large databases
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('pg_dump warnings:', stderr);
    }
    
    // Write SQL dump to file
    fs.writeFileSync(filepath, stdout);
    
    console.log(`SQL backup created: ${path.basename(filepath)}`);
  } catch (error) {
    console.error('Failed to create SQL backup:', error);
    throw new Error(`SQL backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function restoreSQLBackup(filepath: string): Promise<void> {
  try {
    console.log(`Restoring SQL backup from: ${path.basename(filepath)}`);
    
    // Read SQL file
    const sqlContent = fs.readFileSync(filepath, 'utf8');
    
    // Use psql to restore the backup
    let command: string;
    
    if (DATABASE_URL) {
      // Use DATABASE_URL if available
      command = `psql "${DATABASE_URL}"`;
    } else {
      // Use individual connection parameters
      command = `PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"`;
    }
    
    const { stderr } = await execAsync(command, {
      input: sqlContent,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large databases
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('psql warnings:', stderr);
    }
    
    console.log(`✅ SQL backup restored successfully from: ${path.basename(filepath)}`);
  } catch (error) {
    console.error('Failed to restore SQL backup:', error);
    throw new Error(`SQL restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function cleanupOldBackups() {
  try {
    // Get all backup files (now SQL files)
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('auto-backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stat: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // Sort by modification time, newest first

    // If we have more than MAX_BACKUPS, delete the oldest ones
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      }
      
      console.log(`🧹 Cleaned up ${filesToDelete.length} old backup(s), keeping ${MAX_BACKUPS} most recent`);
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

export function getBackupStats() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('auto-backup-') && file.endsWith('.sql'));
    
    return {
      totalBackups: files.length,
      backupDirectory: BACKUP_DIR,
      maxBackups: MAX_BACKUPS
    };
  } catch (error) {
    return {
      totalBackups: 0,
      backupDirectory: BACKUP_DIR,
      maxBackups: MAX_BACKUPS,
      error: 'Could not read backup directory'
    };
  }
}

export function startBackupScheduler() {
  // Schedule backup every 12 hours (at 00:00 and 12:00)
  const task = cron.schedule('0 0,12 * * *', async () => {
    console.log('\n🕒 Scheduled backup starting...');
    await createAutomaticBackup();
  }, {
    scheduled: false,
    timezone: "Europe/Paris"
  });

  // Start the scheduler
  task.start();
  
  console.log('📅 Automatic backup scheduler started');
  console.log('⏰ Backups will run every 12 hours (00:00 and 12:00)');
  console.log(`📁 Backup directory: ${BACKUP_DIR}`);
  console.log(`📚 Maximum backups kept: ${MAX_BACKUPS}`);

  // Create an initial backup if none exist
  const stats = getBackupStats();
  if (stats.totalBackups === 0) {
    console.log('🎯 No existing backups found, creating initial backup...');
    setTimeout(() => createAutomaticBackup(), 5000); // Wait 5 seconds for server to be fully ready
  }

  return task;
}