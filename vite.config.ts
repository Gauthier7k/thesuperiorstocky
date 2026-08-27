import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // project-pages base only for the deployed build — local dev stays at /
  base: command === 'build' ? '/thesuperiorstocky/' : '/',
  plugins: [react()],
  server: { host: true },
}))
