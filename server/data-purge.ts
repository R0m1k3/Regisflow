import { storage } from './storage';
import cron from 'node-cron';

/**
 * Purge des ventes de plus de 19 mois
 * Conformément aux exigences réglementaires de conservation des données
 */
export async function purgeSalesData() {
  try {
    // Calculer la date limite (19 mois en arrière)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 19);
    
    console.log(`🗑️  Démarrage purge des ventes antérieures au ${cutoffDate.toLocaleDateString('fr-FR')}`);
    
    // Use storage's purge method
    const result = await (storage as any).purgeOldSales();
    const deletedCount = result.deletedCount;
    
    if (deletedCount > 0) {
      console.log(`✅ Purge terminée : ${deletedCount} vente(s) supprimée(s)`);
    } else {
      console.log('✅ Purge terminée : aucune vente à supprimer');
    }
    
    return {
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      message: `${deletedCount} vente(s) supprimée(s) (antérieures au ${cutoffDate.toLocaleDateString('fr-FR')})`
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la purge des ventes:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      deletedCount: 0
    };
  }
}

/**
 * Obtenir les statistiques de purge
 */
export async function getPurgeStats() {
  try {
    // Use storage's stats method
    const stats = await (storage as any).getPurgeStats();
    
    return {
      totalSales: stats.totalSales,
      oldSales: stats.oldSales,
      cutoffDate: stats.cutoffDate,
      purgeEligible: stats.oldSales > 0
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques de purge:', error);
    return {
      totalSales: 0,
      oldSales: 0,
      cutoffDate: new Date().toISOString(),
      purgeEligible: false,
      error: error.message
    };
  }
}

/**
 * Démarrer le planificateur de purge automatique
 * Exécute la purge tous les 1er du mois à 02:00
 */
export function startPurgeScheduler() {
  // Tâche planifiée : tous les 1er du mois à 02:00
  cron.schedule('0 2 1 * *', async () => {
    console.log('🕐 Exécution programmée de la purge des ventes');
    await purgeSalesData();
  }, {
    scheduled: true,
    timezone: 'Europe/Paris'
  });
  
  console.log('🕐 Planificateur de purge des ventes démarré');
  console.log('⏰ Purge automatique : 1er de chaque mois à 02:00');
  console.log('📅 Rétention des données : 19 mois maximum');
}

/**
 * Exécuter une purge manuelle (pour l'interface d'administration)
 */
export async function executePurgeManually() {
  console.log('🔧 Purge manuelle demandée via l\'interface d\'administration');
  return await purgeSalesData();
}