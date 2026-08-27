import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // project-pages base — the app is hosted at /thesuperiorstocky/ on GitHub Pages
  base: '/thesuperiorstocky/',
  plugins: [react()],
  server: { host: true },
})
