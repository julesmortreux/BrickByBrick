'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

const WIDGETS = [
  { id: 1, title: "Faisabilité d'Achat", href: "/widgets/faisabilite", from: '#8b5cf6', to: '#7c3aed', premium: false, stat: "Score bancaire", desc: "Votre score sur 100 et capacité d'emprunt réelle", svgSrc: '/widgets/faisabilite.svg' },
  { id: 2, title: "Évolution des Prix", href: "/widgets/dvf-comparateur", from: '#3b82f6', to: '#06b6d4', premium: false, stat: "6M+ transactions", desc: "Prix au m² sur 5 ans dans 96 départements", svgSrc: '/widgets/dvf.svg' },
  { id: 3, title: "Répartition Surfaces", href: "/widgets/repartition-taille", from: '#10b981', to: '#0d9488', premium: true, stat: "Par surface", desc: "Répartition des biens par taille et par zone", svgSrc: '/widgets/taille.svg' },
  { id: 4, title: "Zones Accessibles", href: "/widgets/zones-accessibles", from: '#f59e0b', to: '#f97316', premium: true, stat: "Carte interactive", desc: "Zones où votre budget vous permet d'acheter", svgSrc: '/widgets/zonesaccessibles.svg' },
  { id: 5, title: "Proximité Domicile", href: "/widgets/proximite-domicile", from: '#ef4444', to: '#ec4899', premium: true, stat: "Temps de trajet", desc: "Temps de trajet depuis chaque zone d'achat", svgSrc: '/widgets/proximite.svg' },
  { id: 6, title: "Tension Locative", href: "/widgets/tension-locative", from: '#ef4444', to: '#f87171', premium: true, stat: "96 dép.", desc: "Zones à forte demande pour minimiser la vacance", svgSrc: '/widgets/tensionlocative.svg' },
  { id: 7, title: "Rendement Requis", href: "/widgets/rendement-requis", from: '#06b6d4', to: '#3b82f6', premium: true, stat: "% rentabilité", desc: "Rendement minimal pour équilibrer votre crédit", svgSrc: '/widgets/rendementrequis.svg' },
  { id: 8, title: "Meilleurs Dép.", href: "/widgets/rendement-departement", from: '#6366f1', to: '#8b5cf6', premium: true, stat: "Top classement", desc: "Classement des 96 départements par rendement", svgSrc: '/widgets/rendementdepartement.svg' },
];

const CONTAINER_STYLE = {
  width: '100%',
  maxWidth: 1152,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: 32,
  paddingRight: 32,
  boxSizing: 'border-box' as const,
};



function BrandMark({ height = 34, className = '', priority = false }: { height?: number; className?: string; priority?: boolean }) {
  const w = Math.round((height * 362) / 394);
  return (
    <Image
      src="/logo-mark.png"
      alt="BrickByBrick"
      width={w}
      height={height}
      className={`shrink-0 ${className}`}
      priority={priority}
      unoptimized
      style={{ objectFit: 'contain', objectPosition: 'center' }}
    />
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

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.onboarding_completed === false) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const freeWidgets = WIDGETS.filter(w => !w.premium);
  const premiumWidgets = WIDGETS.filter(w => w.premium);
  const firstName = user?.first_name || 'Investisseur';
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ══════════════════ TOPBAR ══════════════════ */}
      <nav
        className="fixed top-0 right-0 z-40 transition-all duration-300"
        style={{
          left: isSidebarOpen ? 260 : 0,
          height: 72,
          background: scrolled ? 'rgba(9,9,11,0.92)' : 'rgba(9,9,11,0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="flex items-center justify-between h-full"
          style={{ ...CONTAINER_STYLE, maxWidth: 'none' }}
        >
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
              <Link href="/" className="flex items-center gap-3">
                <BrandMark height={28} priority className="leading-none translate-y-[-2px]" />
                <Logo />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                borderRadius: 40,
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                padding: '12px 28px',
                fontSize: '0.875rem',
                lineHeight: 1,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Analyser une annonce
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}
              >
                {initials}
              </div>
              <button
                onClick={logout}
                className="text-sm text-[var(--text-muted)] hover:text-white transition-colors duration-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main
        className="transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? 260 : 0, paddingTop: 72 }}
      >

        {/* ── HERO: AI ANALYZER ── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(91,33,182,0.15) 0%, rgba(9,9,11,0.95) 50%, rgba(49,46,129,0.08) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

          <div className="relative" style={{ ...CONTAINER_STYLE, paddingTop: 64, paddingBottom: 64 }}>
            {/* Greeting */}
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity .5s ease .1s, transform .5s ease .1s',
              }}
            >
              <p className="text-[var(--text-muted)] text-sm" style={{ marginBottom: 8 }}>Tableau de bord</p>
              <h1 className="text-3xl font-bold text-white" style={{ marginBottom: 4 }}>
                Bonjour, {firstName}
              </h1>
            </div>

            <div aria-hidden style={{ height: 40 }} />

            {/* AI Analyzer CTA Card — flip */}
            <Link href="/analyze" className="widget-flip-hero block">
              <div className="widget-flip-inner">

                {/* ── FRONT: big SVG + title ── */}
                <div className="widget-flip-front" style={{
                  background: 'linear-gradient(135deg, rgba(91,33,182,0.25) 0%, rgba(49,46,129,0.12) 50%, rgba(139,92,246,0.06) 100%)',
                  borderColor: 'rgba(139,92,246,0.3)',
                  boxShadow: '0 0 60px rgba(139,92,246,0.08)',
                }}>
                  <Image
                    src="/widgets/analyseIA.svg"
                    alt="Analyseur IA"
                    width={200}
                    height={200}
                    unoptimized
                    style={{ objectFit: 'contain', width: '55%', height: '55%' }}
                  />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', marginTop: 16 }}>
                    Analyseur d'Annonces IA
                  </h2>
                </div>

                {/* ── BACK: info + CTA ── */}
                <div className="widget-flip-back" style={{
                  background: 'linear-gradient(135deg, rgba(91,33,182,0.3) 0%, rgba(49,46,129,0.15) 60%, rgba(139,92,246,0.08) 100%)',
                  borderColor: 'rgba(139,92,246,0.35)',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 40, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
                    OUTIL PRINCIPAL
                  </span>
                  <Image
                    src="/widgets/analyseIA.svg"
                    alt=""
                    width={52}
                    height={52}
                    unoptimized
                    style={{ objectFit: 'contain', opacity: 0.6 }}
                  />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Analyseur d'Annonces IA</h3>
                  <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: 0, maxWidth: 440 }}>
                    Collez un lien SeLoger, Leboncoin ou PAP. L'IA analyse l'annonce, croise les prix du quartier et vous livre un rapport complet en 30 secondes.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4" style={{ marginTop: 4 }}>
                    {['Score sur 100', 'Cash-flow réel', 'Comparaison marché', 'Verdict détaillé'].map(tag => (
                      <div key={tag} className="flex items-center gap-1.5">
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg style={{ width: 9, height: 9, color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Link>
          </div>
        </section>

        {/* ── QUICK STATS ── */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ ...CONTAINER_STYLE, paddingTop: 40, paddingBottom: 40 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '8', label: "Outils d'analyse", color: '#a78bfa' },
                { value: '6M+', label: 'Transactions DVF', color: '#60a5fa' },
                { value: '96', label: 'Départements', color: '#34d399' },
                { value: '30s', label: 'Par analyse IA', color: '#fbbf24' },
              ].map(({ value, label, color }) => (
                <div key={label} className="text-center">
                  <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1.1, marginBottom: 6 }}>
                    {value}
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FREE TOOLS ── */}
        <section>
          <div style={{ ...CONTAINER_STYLE, paddingTop: 56, paddingBottom: 0 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
              <h2 className="text-xl font-bold text-white">Outils gratuits</h2>
              <span
                className="text-xs font-bold"
                style={{
                  padding: '4px 14px',
                  borderRadius: 40,
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#34d399',
                }}
              >
                {freeWidgets.length} disponibles
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{ marginBottom: 0 }}>
              Commencez votre analyse avec nos outils en libre accès.
            </p>

            <div aria-hidden style={{ height: 28 }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {freeWidgets.map((w) => (
                <Link key={w.id} href={w.href} className="widget-flip block">
                  <div className="widget-flip-inner">
                    {/* FRONT: big illustration + title */}
                    <div className="widget-flip-front">
                      <Image
                        src={w.svgSrc}
                        alt={w.title}
                        width={180}
                        height={180}
                        unoptimized
                        style={{ objectFit: 'contain', width: '65%', height: '65%' }}
                      />
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: 14 }}>{w.title}</h3>
                    </div>
                    {/* BACK: small icon + info */}
                    <div className="widget-flip-back">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 40, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                        Gratuit
                      </span>
                      <Image
                        src={w.svgSrc}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        style={{ objectFit: 'contain', opacity: 0.6 }}
                      />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0 }}>{w.title}</h3>
                      <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
                      <span className="text-xs font-semibold text-zinc-500">{w.stat}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div aria-hidden style={{ height: 56 }} />

        {/* ── PREMIUM TOOLS ── */}
        <section>
          <div style={{ ...CONTAINER_STYLE, paddingBottom: 0 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
              <h2 className="text-xl font-bold text-white">Outils Premium</h2>
              <span
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{
                  padding: '4px 14px',
                  borderRadius: 40,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fbbf24',
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                {premiumWidgets.length} outils
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{ marginBottom: 0 }}>
              Débloquez des analyses avancées pour affiner votre stratégie d'investissement.
            </p>

            <div aria-hidden style={{ height: 28 }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {premiumWidgets.map((w) => (
                <Link key={w.id} href={w.href} className="widget-flip block">
                  <div className="widget-flip-inner">
                    {/* FRONT: big illustration + title */}
                    <div className="widget-flip-front">
                      <Image
                        src={w.svgSrc}
                        alt={w.title}
                        width={180}
                        height={180}
                        unoptimized
                        style={{ objectFit: 'contain', width: '65%', height: '65%' }}
                      />
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: 14 }}>{w.title}</h3>
                    </div>
                    {/* BACK: small icon + info */}
                    <div className="widget-flip-back">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 40, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                        Premium
                      </span>
                      <Image
                        src={w.svgSrc}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        style={{ objectFit: 'contain', opacity: 0.6 }}
                      />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0 }}>{w.title}</h3>
                      <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
                      <span className="text-xs font-semibold text-zinc-500">{w.stat}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div aria-hidden style={{ height: 56 }} />

        {/* ── UPGRADE BANNER ── */}
        <section>
          <div style={CONTAINER_STYLE}>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: 24,
                padding: '48px 44px',
                background: 'linear-gradient(135deg, rgba(91,33,182,0.25) 0%, rgba(49,46,129,0.12) 60%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 0 60px rgba(139,92,246,0.08)',
              }}
            >
              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <h3 className="text-xl font-bold text-white">Passez Premium</h3>
                    <span
                      className="text-xs font-bold"
                      style={{
                        padding: '4px 14px',
                        borderRadius: 40,
                        background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                        color: 'white',
                      }}
                    >
                      POPULAIRE
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-base" style={{ lineHeight: 1.7, maxWidth: 480 }}>
                    Débloquez {premiumWidgets.length} outils supplémentaires, des analyses IA illimitées et des rapports détaillés pour investir en confiance.
                  </p>

                  <div aria-hidden style={{ height: 20 }} />

                  <div className="flex flex-wrap items-center gap-5">
                    {['Outils premium', 'Analyses IA illimitées', 'Rapports complets'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg style={{ width: 10, height: 10, color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-sm text-[var(--text-muted)]">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                    borderRadius: 40,
                    boxShadow: '0 8px 30px rgba(139,92,246,0.45)',
                    padding: '14px 36px',
                    fontSize: '0.95rem',
                    lineHeight: 1,
                  }}
                >
                  Premium — 9,90 €/mois
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div aria-hidden style={{ height: 56 }} />

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 0' }}>
          <div className="flex items-center justify-between" style={CONTAINER_STYLE}>
            <div className="flex items-center gap-3">
              <BrandMark height={22} />
            </div>
            <p className="text-xs text-zinc-600">
              Données : transactions notariales françaises · © 2026 BrickByBrick
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
