import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api é encaminhado para o backend (porta 3001). Em produção, defina VITE_API_URL.
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:3001' } } });
