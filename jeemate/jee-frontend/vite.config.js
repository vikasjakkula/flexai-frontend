import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // Added helpful hint for 404: NOT_FOUND on Vercel deployments.
  // If you are seeing a DEPLOYMENT_NOT_FOUND error, ensure your frontend directory is correctly configured as the entrypoint,
  // deployments are not missing or deleted, and your vercel.json correctly maps the "frontend" service.
  // See: https://vercel.com/docs/projects/project-structure#monorepos for more info.
})
