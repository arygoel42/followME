import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  root: './client', // Adjust this to point to the correct root directory
  build: {
    outDir: 'dist', // Ensure this points to the correct output directory
  },
});