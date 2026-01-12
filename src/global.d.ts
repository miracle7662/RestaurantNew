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

interface Window {
  electronAPI: {
    getInstalledPrinters: () => Promise<Array<{ name: string; displayName: string }>>;
    directPrint: (html: string, printerName: string) => Promise<void>;
  };
}
