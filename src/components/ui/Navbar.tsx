import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  const linkClass = (active: boolean) =>
    `block py-3 px-6 text-sm font-medium transition-colors ${
      active ? "text-amber-400" : "text-slate-400 hover:text-white"
    }`;

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/painel">
            <img src="/logo-resenha.png" alt="Logo" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/entrar" />
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="text-slate-400 hover:text-white transition-colors"
            >
              {open ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="mt-2">
          <Link
            to="/painel"
            className={linkClass(location.pathname === "/painel")}
            onClick={() => setOpen(false)}
          >
            Painel
          </Link>
          <Link
            to="/comunidade"
            className={linkClass(location.pathname === "/comunidade")}
            onClick={() => setOpen(false)}
          >
            Comunidade
          </Link>
          <Link
            to="/ranking"
            className={linkClass(location.pathname === "/ranking")}
            onClick={() => setOpen(false)}
          >
            Ranking
          </Link>
          {me?.role === "admin" && (
            <Link
              to="/admin/cursos"
              className={linkClass(location.pathname.startsWith("/admin"))}
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          {me?.role === "pastor" && (
            <Link
              to="/pastor/cursos"
              className={linkClass(location.pathname.startsWith("/pastor"))}
              onClick={() => setOpen(false)}
            >
              Meu Painel
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
