import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/', // Ensures the built assets are served under the '/static/' path
  build: {
    outDir: 'dist', // Output directory for the built files
    assetsDir: 'assets', // Subdirectory for static assets like JS, CSS, images
    emptyOutDir: true, // Clears the output directory before each build
  },
  server: {
    port: 5173, // Development server port
    open: true, // Automatically opens the browser when dev server starts
    strictPort: true, // Ensures Vite fails if the port is already in use
  },
});
