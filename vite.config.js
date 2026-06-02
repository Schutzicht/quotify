import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            input: {
                // Marketing/SEO landing page (served at /)
                home: resolve(__dirname, 'index.html'),
                // The actual offerte generator tool (served at /app)
                app: resolve(__dirname, 'app/index.html'),
            }
        }
    }
});
