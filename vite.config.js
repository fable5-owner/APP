import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this from /APP/, everything else (Netlify, Vercel, local) from /
  base: process.env.GITHUB_PAGES ? '/APP/' : '/',
  plugins: [react()],
})
