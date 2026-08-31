/// <reference types="vite/client" />

// Typed surface of import.meta.env for the VITE_* variables this app reads.
// Keep this list in sync with frontend/.env.example -- see src/config.ts,
// the only file that reads these (ADR 0003).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
