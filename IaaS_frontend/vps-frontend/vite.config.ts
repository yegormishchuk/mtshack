import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/iaas': {
        target: 'http://95.169.204.226:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iaas/, ''),
      },
    },
  },
});

