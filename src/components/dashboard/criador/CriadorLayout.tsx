import { Outlet } from 'react-router-dom'
import { CriadorSidebar } from './CriadorSidebar'

export function CriadorLayout() {
  return (
    <div className="min-h-screen bg-[#0F141A] text-white flex">
      <CriadorSidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
