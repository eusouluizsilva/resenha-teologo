import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

export function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0F141A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white/40">
        <div className="w-8 h-8 border-2 border-[#F37E20]/30 border-t-[#F37E20] rounded-full animate-spin" />
        <p className="text-sm">Autenticando...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
