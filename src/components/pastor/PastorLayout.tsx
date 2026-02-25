import PastorSidebar from "./PastorSidebar";

interface PastorLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export default function PastorLayout({ children, title, actions }: PastorLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <PastorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
