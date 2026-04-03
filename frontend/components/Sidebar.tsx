'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { title: 'Tableau de bord', href: '/dashboard', icon: 'dashboard' },
  { title: 'Analyseur IA', href: '/analyze', icon: 'ai', highlight: true },
];

const WIDGETS = [
  { id: 1, title: 'Faisabilité', href: '/widgets/faisabilite', icon: 'calculator', premium: false },
  { id: 2, title: 'Évolution des prix', href: '/widgets/dvf-comparateur', icon: 'chart', premium: false },
  { id: 3, title: 'Répartition Taille', href: '/widgets/repartition-taille', icon: 'building', premium: true },
  { id: 4, title: 'Zones Accessibles', href: '/widgets/zones-accessibles', icon: 'map', premium: true },
  { id: 5, title: 'Proximité Domicile', href: '/widgets/proximite-domicile', icon: 'home', premium: true },
  { id: 6, title: 'Tension Locative', href: '/widgets/tension-locative', icon: 'stats', premium: true },
  { id: 7, title: 'Rendement Requis', href: '/widgets/rendement-requis', icon: 'coin', premium: true },
  { id: 8, title: 'Rendement / Dép.', href: '/widgets/rendement-departement', icon: 'trophy', premium: true },
];

function SidebarIcon({ name, size = 18 }: { name: string; size?: number }) {
  const s = `${size}px`;
  const props = { width: s, height: s, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5 };

  const paths: Record<string, string> = {
    dashboard: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    ai: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    chart: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    stats: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    coin: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    trophy: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  };

  if (name === 'settings') {
    return (
      <svg style={{ width: s, height: s }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={paths.settings} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }

  return (
    <svg style={{ width: s, height: s }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name] || paths.dashboard} />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-out overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 268,
          fontFamily: "'Inter', system-ui, sans-serif",
          background: 'rgba(18,18,20,0.97)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex flex-col h-full overflow-y-auto">

          {/* ── HEADER ── */}
          <div style={{ padding: '24px 24px 0 24px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 0 }}>
              <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3">
                <Image
                  src="/logo-mark.png"
                  alt="BrickByBrick"
                  width={28}
                  height={30}
                  unoptimized
                  style={{ objectFit: 'contain' }}
                />
                <span className="text-lg font-black tracking-tight leading-none">
                  <span className="text-white">Brick</span>
                  <span className="text-violet-400">By</span>
                  <span className="text-white">Brick</span>
                </span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M1 13L13 1" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>

          <div aria-hidden style={{ height: 24 }} />

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginLeft: 24, marginRight: 24 }} />

          <div aria-hidden style={{ height: 24 }} />

          {/* ── NAVIGATION ── */}
          <div style={{ paddingLeft: 16, paddingRight: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 12, marginBottom: 10 }}>
              Navigation
            </p>
            <nav className="flex flex-col" style={{ gap: 4 }}>
              {NAV_ITEMS.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="group flex items-center gap-3 transition-all duration-150"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #8b5cf6' : '3px solid transparent',
                      color: active ? '#ffffff' : '#a1a1aa',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ffffff'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
                  >
                    <SidebarIcon name={item.icon} size={18} />
                    <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div aria-hidden style={{ height: 20 }} />

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginLeft: 24, marginRight: 24 }} />

          <div aria-hidden style={{ height: 20 }} />

          {/* ── WIDGETS ── */}
          <div style={{ paddingLeft: 16, paddingRight: 16, flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 12, marginBottom: 10 }}>
              Outils
            </p>
            <nav className="flex flex-col" style={{ gap: 2 }}>
              {WIDGETS.map(widget => {
                const active = isActive(widget.href);
                return (
                  <Link
                    key={widget.id}
                    href={widget.href}
                    onClick={handleLinkClick}
                    className="group flex items-center gap-3 transition-all duration-150"
                    style={{
                      padding: '9px 12px',
                      borderRadius: 10,
                      background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #8b5cf6' : '3px solid transparent',
                      color: active ? '#ffffff' : '#a1a1aa',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ffffff'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
                  >
                    <SidebarIcon name={widget.icon} size={16} />
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{widget.title}</span>
                    {widget.premium && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="#52525b" style={{ flexShrink: 0, opacity: 0.6 }}>
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div aria-hidden style={{ height: 16 }} />

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginLeft: 24, marginRight: 24 }} />

          <div aria-hidden style={{ height: 16 }} />

          {/* ── USER SECTION ── */}
          {isAuthenticated && user && (
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 24 }}>
              {/* User card */}
              <div
                className="flex items-center gap-3"
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 8,
                }}
              >
                <div
                  className="flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)',
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }} className="truncate">
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.3 }} className="truncate">
                    {user.email || 'Compte gratuit'}
                  </div>
                </div>
              </div>

              <div aria-hidden style={{ height: 4 }} />

              {/* Settings + Logout */}
              <nav className="flex flex-col" style={{ gap: 2 }}>
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 transition-all duration-150"
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: isActive('/settings') ? 'rgba(139,92,246,0.12)' : 'transparent',
                    borderLeft: isActive('/settings') ? '3px solid #8b5cf6' : '3px solid transparent',
                    color: isActive('/settings') ? '#ffffff' : '#a1a1aa',
                  }}
                  onMouseEnter={e => { if (!isActive('/settings')) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ffffff'; } }}
                  onMouseLeave={e => { if (!isActive('/settings')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
                >
                  <SidebarIcon name="settings" size={16} />
                  <span style={{ fontSize: 13, fontWeight: isActive('/settings') ? 600 : 400 }}>Paramètres</span>
                </Link>

                <button
                  onClick={() => { logout(); handleLinkClick(); }}
                  className="flex items-center gap-3 transition-all duration-150 w-full text-left"
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: 'transparent',
                    border: 'none',
                    borderLeft: '3px solid transparent',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                >
                  <SidebarIcon name="logout" size={16} />
                  <span style={{ fontSize: 13, fontWeight: 400 }}>Déconnexion</span>
                </button>
              </nav>
            </div>
          )}

          {/* Non-authenticated */}
          {!isAuthenticated && (
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 24 }}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="flex items-center justify-center transition-all duration-200"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 40,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#a1a1aa',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#a1a1aa'; }}
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={handleLinkClick}
                  className="flex items-center justify-center transition-all duration-200 hover:opacity-90"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 40,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
                  }}
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
