import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createAutomaticBackup() {
  try {
    console.log('Creating automatic backup...');
    
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
      type: "automatic",
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
        exportedBy: 'system-auto-backup'
      }
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto-backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Write backup to file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Automatic backup created: ${filename}`);
    console.log(`📊 Backup stats: ${users.length} users, ${stores.length} stores, ${allSales.length} sales`);

    // Clean up old backups
    await cleanupOldBackups();
    
    return { success: true, filename, stats: backupData.metadata };
  } catch (error) {
    console.error('❌ Failed to create automatic backup:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function cleanupOldBackups() {
  try {
    // Get all backup files
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('auto-backup-') && file.endsWith('.json'))
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
      .filter(file => file.startsWith('auto-backup-') && file.endsWith('.json'));
    
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