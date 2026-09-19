import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // React Compiler: memoiza componentes e hooks automaticamente, dispensando
    // useMemo/useCallback/React.memo escritos à mão.
    babel({
      presets: [reactCompilerPreset()],
      exclude: /[\\/]node_modules[\\/]/,
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Firebase e o core do React mudam muito menos que o código da loja.
        // Em chunks próprios, eles seguem em cache do navegador entre deploys.
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /[\\/]node_modules[\\/]@?firebase[\\/]/,
              priority: 10,
            },
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              priority: 5,
            },
          ],
        },
      },
    },
  },
})
