'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

// SVG Icons for widgets
const WidgetIcons = {
  calculator: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  building: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  map: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  stats: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  coin: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trophy: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  train: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  home: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

// Widget data
const widgets = [
  {
    id: 1,
    title: "Faisabilité d'Achat",
    subtitle: "Capacité d'investissement",
    icon: 'calculator',
    color: "from-violet-500 to-purple-600",
    description: "Calculez votre score de faisabilité",
    href: "/widgets/faisabilite",
    status: "ready"
  },
  {
    id: 2,
    title: "Comparateur DVF",
    subtitle: "Prix 2020-2024",
    icon: 'chart',
    color: "from-blue-500 to-cyan-500",
    description: "Évolution des prix par département",
    href: "/widgets/dvf-comparateur",
    status: "ready"
  },
  {
    id: 3,
    title: "Répartition Taille",
    subtitle: "Types de biens",
    icon: 'building',
    color: "from-emerald-500 to-teal-500",
    description: "Biens accessibles selon budget",
    href: "/widgets/repartition-taille",
    status: "ready"
  },
  {
    id: 4,
    title: "Zones Accessibles",
    subtitle: "Carte interactive",
    icon: 'map',
    color: "from-amber-500 to-orange-500",
    description: "Visualisez les zones accessibles avec votre budget",
    href: "/widgets/zones-accessibles",
    status: "ready"
  },
  {
    id: 5,
    title: "Proximité Domicile",
    subtitle: "Gares & Relais",
    icon: 'home',
    color: "from-lime-500 to-green-500",
    description: "Trouvez les gares à proximité de votre domicile",
    href: "/widgets/proximite-domicile",
    status: "ready"
  },
  {
    id: 6,
    title: "Tension Locative",
    subtitle: "Données INSEE",
    icon: 'stats',
    color: "from-rose-500 to-pink-500",
    description: "Marchés tendus et vacance",
    href: "/widgets/tension-locative",
    status: "ready"
  },
  {
    id: 7,
    title: "Rendement Requis",
    subtitle: "Calcul personnalisé",
    icon: 'coin',
    color: "from-indigo-500 to-violet-500",
    description: "Rendement pour vos mensualités",
    href: "/widgets/rendement-requis",
    status: "ready"
  },
  {
    id: 8,
    title: "Rendement / Dept",
    subtitle: "Classement national",
    icon: 'trophy',
    color: "from-sky-500 to-blue-500",
    description: "Comparez tous les départements",
    href: "/widgets/rendement-departement",
    status: "ready"
  },
  {
    id: 9,
    title: "Pôles Étudiants",
    subtitle: "Gares & Campus",
    icon: 'train',
    color: "from-fuchsia-500 to-purple-500",
    description: "Gares proches des universités",
    href: "/widgets/poles-etudiants",
    status: "coming"
  }
];

export default function Home() {
  const [hoveredWidget, setHoveredWidget] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-white">Brick</span>
            <span className="text-[var(--primary-light)]">ByBrick</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/analyze"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Analyser une annonce
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-semibold">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <span className="text-white font-medium hidden sm:block">
                    {user.first_name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Airy */}
      <header style={{ paddingTop: '180px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }} className="text-center">
          
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-[var(--text-secondary)] font-medium">Projet PPE 2025-2026</span>
          </div>
          <div style={{ height: '10px' }}></div>
          
          {/* Main Title */}
          <h1 
            className={`text-6xl md:text-8xl font-bold tracking-tight mb-12 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-white">Brick</span>
            <span className="bg-gradient-to-r from-[var(--primary-light)] to-[var(--accent-cyan)] bg-clip-text text-transparent">ByBrick</span>
          </h1>
          <div style={{ height: '20px' }}></div>
          {/* Subtitle */}
          <div className="flex justify-center mb-20">
            <p 
              className={`text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl leading-relaxed text-center ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '0.2s' }}
            >
              Explorez le marché immobilier français
              <br />
              <span className="text-white">avec des données interactives</span>
            </p>
          </div>
          <div style={{ height: '50px' }}></div>
          {/* Stats - Modern Cards */}
          <div 
            className={`flex flex-col sm:flex-row justify-center items-center gap-6 w-full ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="relative bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 rounded-3xl px-8 py-8 text-center backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300" style={{ width: '220px' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">6M+</div>
              <div className="text-sm text-[var(--text-muted)] font-medium">Transactions</div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400/50 animate-pulse" />
            </div>
            <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-3xl px-8 py-8 text-center backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300" style={{ width: '220px' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">96</div>
              <div className="text-sm text-[var(--text-muted)] font-medium">Départements</div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400/50 animate-pulse" />
            </div>
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl px-8 py-8 text-center backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300" style={{ width: '220px' }}>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">8</div>
              <div className="text-sm text-[var(--text-muted)] font-medium">Widgets</div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400/50 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Featured: Analyze CTA */}
      <section style={{ padding: '0 48px 80px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Link href="/analyze" className={`block ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.35s' }}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-cyan-600/20 border-2 border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20" style={{ padding: '40px 48px' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-transparent" />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">Analyseur d'Annonces IA</h3>
                      <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">NOUVEAU</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">Collez un lien SeLoger, Leboncoin ou PAP et obtenez une analyse complète avec score sur 100</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold whitespace-nowrap group-hover:shadow-lg transition-all">
                  Analyser maintenant
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Widgets Section */}
      <main style={{ padding: '0 48px 120px 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Section Header */}
          <div
            className={`text-center mb-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.4s' }}
          >
            <h2 className="text-4xl font-bold text-white mb-2">Nos outils d'analyse</h2>
          </div>
          <div style={{ height: '30px' }}></div>
          {/* Widgets Grid - Large & Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {widgets.map((widget, index) => (
              <Link
                key={widget.id}
                href={widget.status === 'ready' ? widget.href : '#'}
                className={`group block ${widget.status !== 'ready' ? 'cursor-not-allowed' : ''} ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                onMouseEnter={() => setHoveredWidget(widget.id)}
                onMouseLeave={() => setHoveredWidget(null)}
              >
                <div 
                  className={`
                    relative rounded-3xl overflow-hidden
                    bg-[var(--bg-card)] border border-[var(--border-color)]
                    transition-all duration-300 ease-out
                    ${widget.status === 'ready' ? 'hover:border-[var(--border-hover)] hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30' : 'opacity-40'}
                  `}
                  style={{ minHeight: '420px' }}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-5`} />
                  
                  {/* Content */}
                  <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-14 h-14 rounded-2xl bg-gradient-to-br ${widget.color}
                          flex items-center justify-center text-white
                          shadow-lg
                          ${widget.status === 'ready' ? 'group-hover:scale-110' : ''}
                          transition-transform duration-300
                        `}>
                          {WidgetIcons[widget.icon as keyof typeof WidgetIcons]}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {widget.title}
                          </h3>
                          <p className="text-sm text-[var(--text-muted)]">
                            {widget.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="mb-6" style={{ height: '200px', position: 'relative' }}>
                      {widget.status === 'ready' && (
                        <>
                          {widget.id === 1 && (
                            // Faisabilité - Score Circle
                            <div className="flex items-center justify-center h-full">
                              <div className="relative w-32 h-32">
                                <svg className="transform -rotate-90 w-32 h-32">
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                    fill="none"
                                  />
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="url(#gradient1)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * 0.3}`}
                                    strokeLinecap="round"
                                  />
                                  <defs>
                                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#8b5cf6" />
                                      <stop offset="100%" stopColor="#9333ea" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-3xl font-bold text-white">72</span>
                                  <span className="text-xs text-[var(--text-muted)]">Score</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {widget.id === 2 && (
                            // Comparateur DVF - Graphique en ligne simple et clair
                            <div className="h-full flex items-center justify-center px-4 relative">
                              <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                  <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                  </linearGradient>
                                </defs>
                                {/* Axes */}
                                <line x1="30" y1="120" x2="270" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <line x1="30" y1="30" x2="30" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                {/* Ligne de tendance */}
                                <polyline
                                  points="50,100 90,85 130,70 170,60 210,50"
                                  fill="none"
                                  stroke="url(#lineGradient2)"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* Points */}
                                {[
                                  { x: 50, y: 100 },
                                  { x: 90, y: 85 },
                                  { x: 130, y: 70 },
                                  { x: 170, y: 60 },
                                  { x: 210, y: 50 }
                                ].map((point, i) => (
                                  <circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#3b82f6"
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="2"
                                  />
                                ))}
                                {/* Labels années */}
                                {[2020, 2021, 2022, 2023, 2024].map((year, i) => (
                                  <text
                                    key={year}
                                    x={50 + (i * 40)}
                                    y="135"
                                    fontSize="11"
                                    fill="rgba(255,255,255,0.6)"
                                    textAnchor="middle"
                                    fontWeight="500"
                                  >
                                    {year.toString().slice(-2)}
                                  </text>
                                ))}
                              </svg>
                            </div>
                          )}
                          {widget.id === 3 && (
                            // Répartition Taille - Bar Chart horizontal
                            <div className="h-full flex flex-col justify-center gap-3 px-4">
                              {[
                                { label: 'Studio', value: 35, color: '#10b981' },
                                { label: '2p', value: 55, color: '#14b8a6' },
                                { label: '3p', value: 75, color: '#06b6d4' },
                                { label: '4p+', value: 90, color: '#0891b2' }
                              ].map((item, i) => (
                                <div key={item.label} className="flex items-center gap-3">
                                  {/* Label à gauche */}
                                  <div className="text-xs text-[var(--text-muted)] font-medium" style={{ minWidth: '45px' }}>
                                    {item.label}
                                  </div>
                                  {/* Barre horizontale */}
                                  <div className="flex-1 relative" style={{ height: '24px' }}>
                                    <div
                                      className="h-full rounded"
                                      style={{
                                        width: `${item.value}%`,
                                        background: `linear-gradient(to right, ${item.color}, ${item.color}cc)`,
                                        minWidth: '20px',
                                        borderRadius: '4px'
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {widget.id === 4 && (
                            // Zones Accessibles - Hexagone simple avec points colorés
                            <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                              <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '180px' }}>
                                <defs>
                                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a1a24" />
                                    <stop offset="100%" stopColor="#12121a" />
                                  </linearGradient>
                                </defs>
                                
                                {/* Hexagone simple */}
                                <polygon
                                  points="100,30 170,70 170,130 100,170 30,130 30,70"
                                  fill="url(#mapGradient)"
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="2.5"
                                />
                                
                                {/* Points colorés à l'intérieur */}
                                {[
                                  { x: 80, y: 60, color: '#10b981' },
                                  { x: 120, y: 60, color: '#3b82f6' },
                                  { x: 100, y: 80, color: '#10b981' },
                                  { x: 70, y: 90, color: '#f59e0b' },
                                  { x: 130, y: 90, color: '#3b82f6' },
                                  { x: 90, y: 110, color: '#10b981' },
                                  { x: 110, y: 110, color: '#ef4444' },
                                  { x: 100, y: 130, color: '#f59e0b' },
                                  { x: 80, y: 140, color: '#3b82f6' },
                                  { x: 120, y: 140, color: '#10b981' },
                                  { x: 60, y: 100, color: '#10b981' },
                                  { x: 140, y: 100, color: '#f59e0b' }
                                ].map((point, i) => (
                                  <circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill={point.color}
                                    opacity="0.9"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth="1.5"
                                  >
                                    <animate
                                      attributeName="r"
                                      values="5;6.5;5"
                                      dur="2.5s"
                                      repeatCount="indefinite"
                                      begin={`${i * 0.15}s`}
                                    />
                                  </circle>
                                ))}
                                
                                {/* Légende */}
                                <text x="100" y="185" fontSize="11" fill="rgba(255,255,255,0.6)" textAnchor="middle" fontWeight="500">
                                  Carte de France
                                </text>
                              </svg>
                            </div>
                          )}
                          {widget.id === 5 && (
                            // Proximité Domicile - Hexagone avec maison au centre et gares autour
                            <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                              <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '180px' }}>
                                <defs>
                                  <linearGradient id="mapGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a1a24" />
                                    <stop offset="100%" stopColor="#12121a" />
                                  </linearGradient>
                                </defs>
                                
                                {/* Hexagone simple */}
                                <polygon
                                  points="100,30 170,70 170,130 100,170 30,130 30,70"
                                  fill="url(#mapGradient5)"
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="2.5"
                                />
                                
                                {/* Cercle du rayon */}
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="60"
                                  fill="none"
                                  stroke="rgba(59, 130, 246, 0.3)"
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                />
                                
                                {/* Marqueur maison au centre */}
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="8"
                                  fill="#ef4444"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                                <text
                                  x="100"
                                  y="105"
                                  fontSize="12"
                                  fill="white"
                                  textAnchor="middle"
                                  fontWeight="bold"
                                >
                                  🏠
                                </text>
                                
                                {/* Points bleus représentant les gares */}
                                {[
                                  { x: 100, y: 50, color: '#3b82f6' },
                                  { x: 140, y: 70, color: '#3b82f6' },
                                  { x: 160, y: 100, color: '#3b82f6' },
                                  { x: 140, y: 130, color: '#3b82f6' },
                                  { x: 100, y: 150, color: '#3b82f6' },
                                  { x: 60, y: 130, color: '#3b82f6' },
                                  { x: 40, y: 100, color: '#3b82f6' },
                                  { x: 60, y: 70, color: '#3b82f6' }
                                ].map((point, i) => (
                                  <circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill={point.color}
                                    opacity="0.9"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth="1.5"
                                  >
                                    <animate
                                      attributeName="r"
                                      values="5;6.5;5"
                                      dur="2.5s"
                                      repeatCount="indefinite"
                                      begin={`${i * 0.15}s`}
                                    />
                                  </circle>
                                ))}
                                
                                {/* Légende */}
                                <text x="100" y="185" fontSize="11" fill="rgba(255,255,255,0.6)" textAnchor="middle" fontWeight="500">
                                  Proximité Gares
                                </text>
                              </svg>
                            </div>
                          )}
                          {widget.id === 6 && (
                            // Tension Locative - Stats Preview
                            <div className="h-full flex items-center justify-center gap-6">
                              <div className="text-center">
                                <div className="text-4xl font-bold text-emerald-400 mb-1">12%</div>
                                <div className="text-xs text-[var(--text-muted)]">Vacance</div>
                              </div>
                              <div className="h-16 w-px bg-[var(--border-color)]" />
                              <div className="text-center">
                                <div className="text-4xl font-bold text-rose-400 mb-1">8.2%</div>
                                <div className="text-xs text-[var(--text-muted)]">Tension</div>
                              </div>
                            </div>
                          )}
                          {widget.id === 7 && (
                            // Rendement Requis - Gauge Preview
                            <div className="h-full flex flex-col items-center justify-center">
                              <div className="relative w-36 h-20 overflow-hidden">
                                <svg className="w-full h-full" viewBox="0 0 120 70">
                                  {/* Arc de fond */}
                                  <path
                                    d="M 10 60 A 50 50 0 0 1 110 60"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                  />
                                  {/* Arc de valeur */}
                                  <path
                                    d="M 10 60 A 50 50 0 0 1 85 15"
                                    fill="none"
                                    stroke="url(#gaugeGradient7)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                  />
                                  <defs>
                                    <linearGradient id="gaugeGradient7" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#10b981" />
                                      <stop offset="50%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                  <span className="text-3xl font-bold text-white">5.8</span>
                                  <span className="text-lg text-[var(--text-muted)]">%</span>
                                </div>
                              </div>
                              <div className="text-sm text-[var(--text-muted)] mt-4">Rendement requis</div>
                              <div className="flex gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">Excellent</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">Bon</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">Moyen</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {widget.id === 8 && (
                            // Rendement par Département - Bar Chart Preview
                            <div className="h-full flex flex-col items-center justify-center px-4">
                              <div className="w-full max-w-[200px]">
                                {[
                                  { code: '23', pct: 85, color: '#10b981' },
                                  { code: '58', pct: 75, color: '#10b981' },
                                  { code: '36', pct: 65, color: '#3b82f6' },
                                  { code: '03', pct: 55, color: '#3b82f6' },
                                  { code: '18', pct: 45, color: '#f59e0b' },
                                ].map((dept, i) => (
                                  <div key={dept.code} className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-[var(--text-muted)] w-6">{dept.code}</span>
                                    <div className="flex-1 h-5 bg-[var(--bg-secondary)] rounded overflow-hidden">
                                      <div
                                        className="h-full rounded"
                                        style={{
                                          width: `${dept.pct}%`,
                                          backgroundColor: dept.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm text-[var(--text-muted)] mt-4">Top rendements</div>
                              <div className="flex gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">≥7%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">5-7%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  <span className="text-xs text-[var(--text-muted)]">4-5%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {widget.status === 'coming' && (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">Bientôt disponible</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--text-muted)]">
                        {widget.description}
                      </p>
                      {widget.status === 'ready' && (
                        <div className={`
                          w-10 h-10 rounded-full
                          bg-[var(--bg-secondary)] flex items-center justify-center
                          transition-all duration-300
                          ${hoveredWidget === widget.id ? 'bg-gradient-to-br ' + widget.color : ''}
                        `}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-[var(--border-color)]" style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">BrickByBrick</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-sm text-[var(--text-muted)]">Projet PPE 2024-2026</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--text-muted)]">
            <span>DVF</span>
            <span>INSEE</span>
            <span>SNCF</span>
            <span>FastAPI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
