export {};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    contentAnalysisTimeout?: ReturnType<typeof setTimeout>;
  }
}

interface ImportMetaEnv {
  VITE_API_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}