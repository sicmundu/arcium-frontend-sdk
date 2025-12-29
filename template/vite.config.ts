import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'ARCIUM_', 'POOL_', 'CLOCK_'],
    define: {
        'process.env': {}
    }
})
