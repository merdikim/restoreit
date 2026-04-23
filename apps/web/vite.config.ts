import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    react(),
    tailwindcss(),
  ],
});
