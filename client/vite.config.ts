import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
 
   build: {
    outDir: 'dist', // Ensure this points to the correct output directory
  },
  root: '../client'
});