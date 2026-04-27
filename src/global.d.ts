declare module 'date-fns/locale/*' {
  const locale: any
  export default locale
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module 'sanscript';

interface ImportMeta {
 env: {
   VITE_API_URL?: string;
 };
}


interface Window {
  electronAPI: {
    getInstalledPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault?: boolean }>>;
    directPrint: (html: string, printerName: string) => Promise<void>;
    loadConfig: () => Promise<AppConfig | null>;
    hasConfigFile: () => Promise<boolean>;
    saveConfig: (config: AppConfig) => Promise<{ success: boolean; error?: string }>;
    testConfig: (config: AppConfig) => Promise<ConfigTestResult>;
    getSystemIPv4: () => Promise<string>;
  };
}
