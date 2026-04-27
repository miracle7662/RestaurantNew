import { AppConfig } from './types/config';
import { configureBackend } from './common/api/backend';

let cachedConfig: AppConfig | null = null;

export const loadConfig = async (): Promise<AppConfig> => {
  if (cachedConfig) return cachedConfig;
  
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      cachedConfig = await (window as any).electronAPI.loadConfig();
      if (cachedConfig) {
        // Auto-configure axios with loaded config
        configureBackend(cachedConfig);
        console.log('✅ Config loaded and axios configured:', cachedConfig.serverIP, cachedConfig.port);
        return cachedConfig;
      }
    } catch (error) {
      console.error('Config load failed:', error);
    }
  }
  
  // Fallback defaults (for dev)
  cachedConfig = {
    serverIP: 'localhost',
    port: 3001,
    dbHost: 'localhost',
    dbPort: 3306,
    dbName: 'restaurant_db',
    dbUser: 'root',
    dbPass: ''
  };
  
  configureBackend(cachedConfig);
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
  if (typeof window !== 'undefined' && (window as any).electronAPI?.getSystemIPv4) {
    try {
      const ip = await (window as any).electronAPI.getSystemIPv4();
      return ip || '127.0.0.1';
    } catch (error) {
      console.error('getSystemIPv4 failed:', error);
    }
  }
  return '127.0.0.1';
};

export default { loadConfig, getAPIUrl };
