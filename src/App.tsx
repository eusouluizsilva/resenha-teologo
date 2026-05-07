// Chrome global da aplicação: BrowserRouter, banners, Suspense e tracking.
// O mapa de rotas vive em src/routes/AppRoutes.tsx pra manter este arquivo
// focado só no que envolve toda a árvore (auth gates ficam no DashboardLayout).

import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BannerCookies } from '@/components/BannerCookies'
import { CommandPalette } from '@/components/CommandPalette'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification'
import { RouteFallback, RouteTracker } from '@/routes/RouteHelpers'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <RouteTracker />
      <BannerCookies />
      <CommandPalette />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </AnimatePresence>
    </BrowserRouter>
  )
}
