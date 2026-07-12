/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL Web App Google Apps Script default (opsional).
   * Diset lewat environment variable saat build (Vercel/GitHub Actions),
   * BUKAN di-hardcode di source code — supaya repo publik tetap aman
   * sementara deployment produksi tetap otomatis tersambung ke Drive.
   */
  readonly VITE_GAS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
