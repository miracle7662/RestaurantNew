export interface AppConfig {
  serverIP: string;
  port: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPass: string;
}

export type ConfigTestResult = {
  success: boolean;
  apiUrl?: string;
  error?: string;
};

