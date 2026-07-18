import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';

// One entry per component folder -> per-component subpath imports + tree shaking
const componentEntries: Record<string, string> = {};
for (const dir of readdirSync(resolve(__dirname, 'src'))) {
  const full = resolve(__dirname, 'src', dir);
  if (statSync(full).isDirectory() && readdirSync(full).includes('index.ts')) {
    componentEntries[`${dir}/index`] = resolve(full, 'index.ts');
  }
}

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({ include: ['src'], exclude: ['src/**/*.test.*'], tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    lib: {
      entry: { index: resolve(__dirname, 'src/index.ts'), ...componentEntries },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/'),
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
        // Every component uses hooks — mark all emitted modules as client
        // components for React Server Component bundlers (Next.js).
        banner: "'use client';",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
