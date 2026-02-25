import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

const navItems = [
  {
    href: "/pastor/cursos",
    label: "Meus Cursos",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function PastorSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-slate-800">
        <Link to="/pastor/cursos" className="text-amber-400 font-bold text-lg">
          Painel Pastor
        </Link>
        <p className="text-slate-500 text-xs mt-0.5">Plataforma Bíblica</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-400/10 text-amber-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-3">
        <UserButton afterSignOutUrl="/entrar" />
        <Link to="/painel" className="text-slate-500 hover:text-amber-400 text-xs transition-colors">
          Ir para Área do Membro
        </Link>
      </div>
    </aside>
  );
}
