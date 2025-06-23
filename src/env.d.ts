/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ELEVENLABS_API_KEY: string
  readonly VITE_TAVUS_API_KEY: string
  readonly VITE_REVENUECAT_API_KEY: string
  readonly VITE_ALGORAND_NODE_URL: string
  readonly VITE_ALGORAND_INDEXER_URL: string
  readonly VITE_ALGORAND_NODE_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Buffer polyfill for browser compatibility
declare global {
  interface Window {
    Buffer: typeof Buffer
  }
}