// Utilitaires de diagnostic caméra pour production
export interface CameraCapabilities {
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  isHTTPS: boolean;
  userAgent: string;
  availableDevices: MediaDeviceInfo[];
  constraints: {
    video: boolean;
    audio: boolean;
  };
}

export async function getCameraCapabilities(): Promise<CameraCapabilities> {
  const capabilities: CameraCapabilities = {
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
    userAgent: navigator.userAgent,
    availableDevices: [],
    constraints: {
      video: false,
      audio: false
    }
  };

  // Énumérer les appareils disponibles si possible
  if (capabilities.hasMediaDevices) {
    try {
      capabilities.availableDevices = await navigator.mediaDevices.enumerateDevices();
    } catch (error) {
      console.warn('Cannot enumerate devices:', error);
    }

    // Tester les contraintes supportées
    if (capabilities.hasGetUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        capabilities.constraints.video = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Video not supported:', error);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        capabilities.constraints.audio = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    }
  }

  return capabilities;
}

export function logCameraCapabilities(capabilities: CameraCapabilities): void {
  console.group('🔍 Camera Capabilities Report');
  console.log('Media Devices API:', capabilities.hasMediaDevices ? '✅' : '❌');
  console.log('getUserMedia API:', capabilities.hasGetUserMedia ? '✅' : '❌');
  console.log('HTTPS Connection:', capabilities.isHTTPS ? '✅' : '⚠️');
  console.log('User Agent:', capabilities.userAgent);
  console.log('Video Support:', capabilities.constraints.video ? '✅' : '❌');
  console.log('Audio Support:', capabilities.constraints.audio ? '✅' : '❌');
  
  if (capabilities.availableDevices.length > 0) {
    console.log('Available Devices:');
    capabilities.availableDevices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.kind}: ${device.label || 'Unknown'}`);
    });
  } else {
    console.log('Available Devices: None found or permission denied');
  }
  
  console.groupEnd();
}

export function generateCameraReport(capabilities: CameraCapabilities): string {
  const deviceCount = capabilities.availableDevices.filter(d => d.kind === 'videoinput').length;
  
  let report = `=== Rapport Caméra Production ===\n`;
  report += `Navigateur: ${capabilities.userAgent.split(' ')[0]}\n`;
  report += `HTTPS: ${capabilities.isHTTPS ? 'Oui' : 'Non'}\n`;
  report += `API Média: ${capabilities.hasMediaDevices ? 'Disponible' : 'Indisponible'}\n`;
  report += `getUserMedia: ${capabilities.hasGetUserMedia ? 'Disponible' : 'Indisponible'}\n`;
  report += `Support Vidéo: ${capabilities.constraints.video ? 'Oui' : 'Non'}\n`;
  report += `Caméras détectées: ${deviceCount}\n`;
  
  if (!capabilities.isHTTPS && location.hostname !== 'localhost') {
    report += `\n⚠️ ATTENTION: Connexion non sécurisée détectée.\n`;
    report += `La caméra peut ne pas fonctionner sans HTTPS.\n`;
  }
  
  if (!capabilities.hasGetUserMedia) {
    report += `\n❌ ERREUR: API getUserMedia non disponible.\n`;
    report += `Utilisez un navigateur moderne (Chrome, Firefox, Safari).\n`;
  }
  
  if (deviceCount === 0) {
    report += `\n⚠️ ATTENTION: Aucune caméra détectée.\n`;
    report += `Vérifiez les permissions ou connectez une caméra.\n`;
  }
  
  return report;
}