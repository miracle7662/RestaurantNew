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

export default { loadConfig, getAPIUrl };
