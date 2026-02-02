'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Widget data (same as in page.tsx)
const widgets = [
  {
    id: 1,
    title: "Faisabilité d'Achat",
    href: "/widgets/faisabilite",
    icon: 'calculator',
  },
  {
    id: 2,
    title: "Comparateur DVF",
    href: "/widgets/dvf-comparateur",
    icon: 'chart',
  },
  {
    id: 3,
    title: "Répartition Taille",
    href: "/widgets/repartition-taille",
    icon: 'building',
  },
  {
    id: 4,
    title: "Zones Accessibles",
    href: "/widgets/zones-accessibles",
    icon: 'map',
  },
  {
    id: 5,
    title: "Proximité Domicile",
    href: "/widgets/proximite-domicile",
    icon: 'home',
  },
  {
    id: 6,
    title: "Tension Locative",
    href: "/widgets/tension-locative",
    icon: 'stats',
  },
  {
    id: 7,
    title: "Rendement Requis",
    href: "/widgets/rendement-requis",
    icon: 'coin',
  },
  {
    id: 8,
    title: "Rendement / Dept",
    href: "/widgets/rendement-departement",
    icon: 'trophy',
  },
];

// SVG Icons
const Icons = {
  calculator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  stats: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  coin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ai: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Close sidebar when clicking on a link (mobile)
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-[var(--bg-card)] border-r border-[var(--border-color)]
          transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full" style={{ padding: '32px 24px' }}>
          {/* Logo and Close Button */}
          <div className="mb-12 flex items-center justify-between">
            <Link href="/" onClick={handleLinkClick} className="block group">
              <div className="text-2xl font-bold transition-transform duration-300 group-hover:scale-105">
                <span className="text-white">Brick</span>
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-cyan)] bg-clip-text text-transparent">ByBrick</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-muted)] hover:text-white"
              aria-label="Fermer la sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Section */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 pl-4">
              Navigation
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl
                  transition-all duration-300 group
                  ${isActive('/') 
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary-glow)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
                  }
                `}
              >
                <div className={`${isActive('/') ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-medium">Accueil</span>
              </Link>

              <Link
                href="/analyze"
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl
                  transition-all duration-300 group
                  ${isActive('/analyze') 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
                  }
                `}
              >
                <div className={`${isActive('/analyze') ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
                  {Icons.ai}
                </div>
                <span className="font-medium">Analyseur IA</span>
              </Link>
            </nav>
          </div>

          {/* Widgets Section */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 pl-4">
              Outils
            </h3>
            <nav className="flex flex-col gap-2">
              {widgets.map((widget) => (
                <Link
                  key={widget.id}
                  href={widget.href}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-300 group
                    ${isActive(widget.href) 
                      ? 'bg-[var(--bg-secondary)] text-white border border-[var(--border-color)] shadow-inner'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
                    }
                  `}
                >
                  <div className={`${isActive(widget.href) ? 'text-[var(--primary-light)]' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
                    {Icons[widget.icon as keyof typeof Icons]}
                  </div>
                  <span className="font-medium text-sm">{widget.title}</span>
                  {isActive(widget.href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary-light)] animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account Section */}
          {isAuthenticated && user && (
            <div className="mt-auto pt-8 border-t border-[var(--border-color)]">
              <div className="flex flex-col gap-2">
                {/* User Info */}
                <div className="flex items-center gap-4 px-4 py-3 mb-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {user.first_name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Settings Link */}
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-300 group
                    ${isActive('/settings') 
                      ? 'bg-[var(--bg-secondary)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
                    }
                  `}
                >
                  <div className={`${isActive('/settings') ? 'text-[var(--primary-light)]' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
                    {Icons.settings}
                  </div>
                  <span className="font-medium">Paramètres</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    handleLinkClick();
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group w-full text-left"
                >
                  <div className="text-[var(--text-muted)] group-hover:text-red-400 transition-colors">
                    {Icons.logout}
                  </div>
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </div>
          )}

          {/* Login/Register for non-authenticated users */}
          {!isAuthenticated && (
            <div className="mt-auto pt-8 border-t border-[var(--border-color)]">
              <div className="flex flex-col gap-4">
                <Link
                  href="/register"
                  onClick={handleLinkClick}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-medium hover:shadow-lg hover:shadow-[var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span>Commencer gratuitement</span>
                </Link>
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-all duration-300 border border-transparent hover:border-[var(--border-color)]"
                >
                  <span className="font-medium">Se connecter</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
