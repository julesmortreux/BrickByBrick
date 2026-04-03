'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';

const PAGE_TITLES: Record<string, string> = {
  '/widgets/faisabilite':          "Faisabilité d'Achat",
  '/widgets/dvf-comparateur':      'Évolution des Prix',
  '/widgets/repartition-taille':   'Répartition Surfaces',
  '/widgets/zones-accessibles':    'Zones Accessibles',
  '/widgets/proximite-domicile':   'Proximité Domicile',
  '/widgets/tension-locative':     'Tension Locative',
  '/widgets/rendement-requis':     'Rendement Requis',
  '/widgets/rendement-departement':'Meilleurs Dép.',
  '/widgets/carte-zones':          'Carte des Zones',
};

function BrandMark({ height = 26 }: { height?: number }) {
  const w = Math.round((height * 362) / 394);
  return (
    <Image src="/logo-mark.png" alt="BrickByBrick" width={w} height={height} unoptimized priority style={{ objectFit: 'contain' }} />
  );
}

function Logo() {
  return (
    <span className="text-xl font-black tracking-tight leading-none">
      <span className="text-white">Brick</span>
      <span className="text-violet-400">By</span>
      <span className="text-white">Brick</span>
    </span>
  );
}

export default function WidgetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Outil';
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      setIsSidebarOpen(saved !== null ? saved === 'true' : window.innerWidth >= 1024);
    }
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }
  }, [isSidebarOpen]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ══ TOPBAR ══ */}
      <nav
        className="fixed top-0 right-0 z-40 transition-all duration-300"
        style={{
          left: isSidebarOpen ? 268 : 0,
          height: 72,
          background: scrolled ? 'rgba(9,9,11,0.92)' : 'rgba(9,9,11,0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center justify-between h-full" style={{ paddingLeft: 24, paddingRight: 32 }}>
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              className="w-10 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center hover:bg-[var(--bg-card)] transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect y="0"  width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 origin-center ${isSidebarOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
                <rect y="6"  width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 ${isSidebarOpen ? 'opacity-0' : ''}`} />
                <rect y="12" width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 origin-center ${isSidebarOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
              </svg>
            </button>

            {!isSidebarOpen && (
              <Link href="/dashboard" className="flex items-center gap-3">
                <BrandMark height={26} />
                <Logo />
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-2" style={{ marginLeft: isSidebarOpen ? 0 : 8 }}>
              <span className="text-[var(--text-muted)] text-sm">/</span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">{pageTitle}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </Link>

            {isAuthenticated && user ? (
              <>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }}
                >
                  {initials}
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Connexion</Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px text-sm"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 40, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '10px 22px', lineHeight: 1 }}
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page content — shifts right when sidebar is open */}
      <div className="transition-all duration-300" style={{ marginLeft: isSidebarOpen ? 268 : 0 }}>
        {children}
      </div>
    </div>
  );
}
