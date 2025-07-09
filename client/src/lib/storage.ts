import { Sale, BackupData } from '@/types/sale';

const DB_NAME = 'VentesPetardsDB';
const DB_VERSION = 1;
const STORE_NAME = 'ventes';
const BACKUP_KEY = 'petards_backup_csv';

export class FireworksDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('nom', 'nom', { unique: false });
          store.createIndex('dateVente', 'dateVente', { unique: false });
        }
      };
    });
  }

  async saveSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const saleWithTimestamp = {
        ...sale,
        timestamp: new Date().toISOString()
      };
      
      const request = store.add(saleWithTimestamp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const savedSale = { ...saleWithTimestamp, id: request.result as number };
        resolve(savedSale);
      };
    });
  }

  async getAllSales(): Promise<Sale[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteSale(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export async function createAutoBackup(sales: Sale[]): Promise<void> {
  const backupData: BackupData = {
    timestamp: new Date().toISOString(),
    sales,
    recordCount: sales.length
  };

  localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
}

export function getAutoBackup(): BackupData | null {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    return backup ? JSON.parse(backup) : null;
  } catch (error) {
    console.error('Error loading backup:', error);
    return null;
  }
}

export function downloadBackup(): void {
  const backup = getAutoBackup();
  if (!backup) return;

  const blob = new Blob([JSON.stringify(backup, null, 2)], { 
    type: 'application/json' 
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `backup_petards_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(link.href);
}
