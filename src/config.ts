const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
}

import { AppConfig } from './types/config';

let cachedConfig: AppConfig | null = null;

export const loadConfig = async (): Promise<AppConfig> => {
  if (cachedConfig) return cachedConfig;
  
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      cachedConfig = await (window as any).electronAPI.loadConfig();
      if (cachedConfig) return cachedConfig;
    } catch (error) {
      console.error('Config load failed:', error);
    }
  }
  
  throw new Error('No valid config found. Please configure server settings.');
};

export const getAPIUrl = (config: AppConfig): string => 
  `http://${config.serverIP}:${config.port}`;

export const clearConfigCache = () => {
  cachedConfig = null;
};

export default config;
