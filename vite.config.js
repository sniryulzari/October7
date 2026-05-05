import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import Sitemap from 'vite-plugin-sitemap'

const SITE_URL = 'https://october7.vercel.app'

const staticRoutes = [
  '/',
  '/map',
  '/search',
  '/route',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/accessibilitystatement',
]

async function fetchLocationRoutes(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) return []
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/locations?select=id&is_active=eq.true`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (!res.ok) return []
    const rows = await res.json()
    return rows.map(r => `/location?id=${r.id}`)
  } catch {
    return []
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const locationRoutes = await fetchLocationRoutes(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY
  )

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'בשביל הזיכרון 7 באוקטובר',
          short_name: 'בשביל הזיכרון',
          description: 'בשביל הזיכרון 7 באוקטובר – אתרי הטבח בעוטף עזה',
          theme_color: '#1E3A5F',
          background_color: '#F5F5F5',
          display: 'standalone',
          dir: 'rtl',
          lang: 'he',
          start_url: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }
              }
            }
          ]
        }
      }),
      Sitemap({
        hostname: SITE_URL,
        dynamicRoutes: [...staticRoutes, ...locationRoutes],
      }),
    ],
    server: {
      allowedHosts: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  }
})
