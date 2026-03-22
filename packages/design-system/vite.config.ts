import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'showcase',
  resolve: {
    alias: {
      '@resequence/design-system/css/tokens.css': path.resolve(__dirname, './src/css/tokens.css'),
      '@resequence/design-system/css/utilities.css': path.resolve(__dirname, './src/css/utilities.css'),
      '@resequence/design-system': path.resolve(__dirname, './src/index.ts'),
    },
  },
})
