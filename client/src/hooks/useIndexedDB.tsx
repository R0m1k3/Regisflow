import { useState, useEffect, useCallback } from 'react';
import { Sale } from '@/types/sale';
import { FireworksDB, createAutoBackup } from '@/lib/storage';

export function useIndexedDB() {
  const [db] = useState(() => new FireworksDB());
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const allSales = await db.getAllSales();
      setSales(allSales.sort((a, b) => new Date(b.dateVente).getTime() - new Date(a.dateVente).getTime()));
      setError(null);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Erreur lors du chargement des ventes');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const saveSale = useCallback(async (saleData: Omit<Sale, 'id' | 'timestamp'>) => {
    try {
      const savedSale = await db.saveSale(saleData);
      setSales(prev => [savedSale, ...prev]);
      
      // Create auto backup
      const updatedSales = await db.getAllSales();
      await createAutoBackup(updatedSales);
      
      setError(null);
      return savedSale;
    } catch (err) {
      console.error('Error saving sale:', err);
      setError('Erreur lors de l\'enregistrement');
      throw err;
    }
  }, [db]);

  const deleteSale = useCallback(async (id: number) => {
    try {
      await db.deleteSale(id);
      setSales(prev => prev.filter(sale => sale.id !== id));
      
      // Update auto backup
      const updatedSales = await db.getAllSales();
      await createAutoBackup(updatedSales);
      
      setError(null);
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Erreur lors de la suppression');
      throw err;
    }
  }, [db]);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        await loadSales();
      } catch (err) {
        console.error('Error initializing database:', err);
        setError('Erreur d\'initialisation de la base de données');
        setIsLoading(false);
      }
    };

    initDB();
  }, [db, loadSales]);

  return {
    sales,
    isLoading,
    error,
    saveSale,
    deleteSale,
    loadSales
  };
}
