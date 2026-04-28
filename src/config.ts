import { AppConfig } from './types/config';
import { configureBackend } from './common/api/backend';

let cachedConfig: AppConfig | null = null;

export const loadConfig = async (): Promise<AppConfig> => {
  if (cachedConfig) {
    console.log('📦 loadConfig: returning cached config', cachedConfig.serverIP);
    return cachedConfig;
  }

  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      let config = await (window as any).electronAPI.loadConfig();
      console.log('📥 loadConfig: raw config from electronAPI:', JSON.stringify(config));
      if (config) {
        // Auto-inject real IPv4 if saved IP is localhost/127.0.0.1
        const systemIP = await getSystemIPv4();
        const savedIP = normalizeIP(config.serverIP);
        console.log('🔍 loadConfig: systemIP =', systemIP, '| savedIP =', savedIP, '| raw serverIP =', config.serverIP);

        if (savedIP === '127.0.0.1' || !config.serverIP) {
          config.serverIP = systemIP;
          console.log('🔄 loadConfig: Auto-injected serverIP (localhost) →', systemIP);
        } else if (hasIPChanged(config.serverIP, systemIP)) {
          config.serverIP = systemIP;
          console.log('🔄 loadConfig: Auto-updated serverIP (network changed) →', systemIP);
        } else {
          console.log('✅ loadConfig: serverIP unchanged:', config.serverIP);
        }

        const savedDbHost = normalizeIP(config.dbHost);
        if (savedDbHost === '127.0.0.1' || !config.dbHost) {
          config.dbHost = systemIP;
          console.log('🔄 loadConfig: Auto-injected dbHost (localhost) →', systemIP);
        } else if (hasIPChanged(config.dbHost, systemIP)) {
          config.dbHost = systemIP;
          console.log('🔄 loadConfig: Auto-updated dbHost (network changed) →', systemIP);
        } else {
          console.log('✅ loadConfig: dbHost unchanged:', config.dbHost);
        }

        cachedConfig = config;
        configureBackend(config);
        console.log('✅ Config loaded and axios configured:', config.serverIP, config.port);
        return config;
      }
    } catch (error) {
      console.error('Config load failed:', error);
    }
  } else {
    console.warn('⚠️ loadConfig: electronAPI not available, using fallback');
  }

  // Fallback defaults (for dev) — auto-inject real IP
  const fallbackIP = await getSystemIPv4();
  console.log('🛟 loadConfig: fallback IP =', fallbackIP);
  cachedConfig = {
    serverIP: fallbackIP,
    port: 3001,
    dbHost: fallbackIP,
    dbPort: 3306,
    dbName: 'restaurant_db',
    dbUser: 'root',
    dbPass: ''
  };

  configureBackend(cachedConfig);
  console.log('✅ Fallback config loaded:', cachedConfig.serverIP, cachedConfig.port);
  return cachedConfig;
};

export const getAPIUrl = (config: AppConfig): string => 
  `http://${config.serverIP}:${config.port}/api`;

export const clearConfigCache = () => {
  cachedConfig = null;
};

export const getCurrentConfig = () => cachedConfig;

// Normalize IP for comparison: localhost === 127.0.0.1
function normalizeIP(ip: string | undefined): string {
  if (!ip) return '';
  const trimmed = ip.trim().toLowerCase();
  if (trimmed === 'localhost') return '127.0.0.1';
  return trimmed;
}

/**
 * Compare saved config IP with current system IP.
 * Returns true if they differ (or either is missing).
 * Treats localhost and 127.0.0.1 as equal.
 */
export const hasIPChanged = (savedIP: string | undefined, currentIP: string | undefined): boolean => {
  const a = normalizeIP(savedIP);
  const b = normalizeIP(currentIP);
  if (!a || !b) return true; // missing = changed
  return a !== b;
};

/**
 * Get the system's current IPv4 address from the main process.
 */
export const getSystemIPv4 = async (): Promise<string> => {
  console.log('🌐 getSystemIPv4: checking electronAPI...');
  if (typeof window !== 'undefined' && (window as any).electronAPI?.getSystemIPv4) {
    try {
      const ip = await (window as any).electronAPI.getSystemIPv4();
      console.log('🌐 getSystemIPv4: fetched IP from main =', ip);
      return ip || '127.0.0.1';
    } catch (error) {
      console.error('getSystemIPv4 failed:', error);
    }
  } else {
    console.warn('⚠️ getSystemIPv4: electronAPI.getSystemIPv4 not available');
  }
  console.log('🌐 getSystemIPv4: returning fallback 127.0.0.1');
  return '127.0.0.1';
};

export default { loadConfig, getAPIUrl };
