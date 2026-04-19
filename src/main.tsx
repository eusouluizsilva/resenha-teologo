import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

const hasClerk = CLERK_KEY && !CLERK_KEY.includes('COLE_SUA_CHAVE')
const hasConvex = CONVEX_URL && !CONVEX_URL.includes('SEU_URL')

const convex = hasConvex ? new ConvexReactClient(CONVEX_URL) : null

function Providers({ children }: { children: React.ReactNode }) {
  if (hasClerk && hasConvex && convex) {
    return (
      <ClerkProvider publishableKey={CLERK_KEY}>
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      </ClerkProvider>
    )
  }
  if (hasClerk) {
    return <ClerkProvider publishableKey={CLERK_KEY}>{children}</ClerkProvider>
  }
  if (hasConvex && convex) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>
  }
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
)
