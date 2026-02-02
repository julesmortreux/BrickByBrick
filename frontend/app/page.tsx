'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import SidebarToggle from '@/components/SidebarToggle';
import WidgetCarousel from '@/components/WidgetCarousel';
import WidgetList from '@/components/WidgetList';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAllWidgets, setShowAllWidgets] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    // On desktop (lg breakpoint = 1024px), sidebar is visible by default
    // But user can still close it
    if (typeof window !== 'undefined') {
      // Check localStorage for user preference
      const savedState = localStorage.getItem('sidebarOpen');
      if (savedState !== null) {
        setIsSidebarOpen(savedState === 'true');
      } else {
        // Default: open on desktop, closed on mobile
        setIsSidebarOpen(window.innerWidth >= 1024);
      }
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }
  }, [isSidebarOpen]);

  // Redirect to onboarding if user is authenticated but hasn't completed it
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.onboarding_completed === false) {
      router.push('/onboarding');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Sidebar Toggle Button */}
      <SidebarToggle 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content - Adjusted for sidebar */}
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isSidebarOpen ? '280px' : '0',
          width: isSidebarOpen ? 'calc(100% - 280px)' : '100%'
        }}
      >
        <div className="max-w-[1600px] mx-auto">

          {/* Hero Section */}
          <section className="relative pt-32 pb-24 px-8 md:px-12 lg:px-16 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute top-20 left-20 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
              {/* Badge */}
              <div
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] mb-10 backdrop-blur-md shadow-lg shadow-black/10 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-[var(--text-secondary)] font-medium">Projet PPE 2025-2026</span>
              </div>

              {/* Main Title */}
              <h1
                className={`text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '0.1s' }}
              >
                <span className="text-white block mb-2">Construisez votre</span>
                <span className="bg-gradient-to-r from-[var(--primary-light)] via-[var(--accent-cyan)] to-[var(--primary)] bg-clip-text text-transparent">
                  Avenir Immobilier
                </span>
              </h1>

              {/* Subtitle */}
              <p 
                className={`text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '0.2s' }}
              >
                Analysez le marché, trouvez les meilleures opportunités et sécurisez vos investissements avec notre suite d'outils intelligents.
              </p>

              {/* Stats - Modern Cards */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '0.3s' }}
              >
                {/* Stat 1 */}
                <div className="group relative p-8 rounded-3xl bg-[var(--bg-card)]/50 border border-[var(--border-color)] hover:border-violet-500/30 transition-all duration-300 hover:bg-[var(--bg-card)] hover:shadow-2xl hover:shadow-violet-500/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300 origin-left">
                    6M+
                  </div>
                  <div className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    Transactions analysées
                  </div>
                  <div className="absolute top-6 right-6 p-2 rounded-xl bg-violet-500/10 text-violet-400 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="group relative p-8 rounded-3xl bg-[var(--bg-card)]/50 border border-[var(--border-color)] hover:border-cyan-500/30 transition-all duration-300 hover:bg-[var(--bg-card)] hover:shadow-2xl hover:shadow-cyan-500/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300 origin-left">
                    96
                  </div>
                  <div className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    Départements couverts
                  </div>
                  <div className="absolute top-6 right-6 p-2 rounded-xl bg-cyan-500/10 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="group relative p-8 rounded-3xl bg-[var(--bg-card)]/50 border border-[var(--border-color)] hover:border-emerald-500/30 transition-all duration-300 hover:bg-[var(--bg-card)] hover:shadow-2xl hover:shadow-emerald-500/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300 origin-left">
                    8
                  </div>
                  <div className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    Outils d'analyse
                  </div>
                  <div className="absolute top-6 right-6 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured: Analyze CTA - Floating Glass Card */}
          <section className="px-8 md:px-12 lg:px-16 pb-32">
            <div className={`relative max-w-5xl mx-auto ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[32px] blur-2xl opacity-20 animate-pulse" />

              <Link href="/analyze" className="block relative group">
                <div className="relative overflow-hidden rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-violet-500/50 transition-all duration-300 p-8 md:p-12 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20">

                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <h3 className="text-3xl font-bold text-white group-hover:text-violet-300 transition-colors">
                            Analyseur d'Annonces IA
                          </h3>
                          <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
                            BÊTA
                          </span>
                        </div>
                        <p className="text-lg text-[var(--text-secondary)] max-w-lg">
                          Copiez le lien d'une annonce (SeLoger, Leboncoin, PAP) et laissez notre IA analyser la rentabilité pour vous.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-violet-50 transition-colors shadow-lg shadow-white/10 group-hover:shadow-white/20">
                      Analyser maintenant
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Widgets Section */}
          <main className="px-8 md:px-12 lg:px-16 pb-32">
            <div className="max-w-7xl mx-auto">

              {/* Section Header */}
              <div
                className={`flex flex-col md:flex-row items-end justify-between gap-8 mb-16 border-b border-[var(--border-color)] pb-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '0.5s' }}
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-violet-400 text-sm font-bold uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    Explorer le marché
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white">Nos Outils d'Analyse</h2>
                </div>
                <p className="text-lg text-[var(--text-secondary)] max-w-md text-right md:text-left">
                  Une suite complète de widgets interactifs pour prendre des décisions éclairées.
                </p>
              </div>

              {/* Carousel */}
              {!showAllWidgets && (
                <div className={`${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                  <WidgetCarousel />
                </div>
              )}

              {/* Toggle Button */}
              <div className="flex justify-center mt-16 mb-8">
                <button
                  onClick={() => setShowAllWidgets(!showAllWidgets)}
                  className={`
                    group flex items-center gap-3 px-8 py-4 rounded-full
                    bg-[var(--bg-card)] border border-[var(--border-color)]
                    text-white font-medium
                    hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)]/50
                    transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary-glow)]
                    ${mounted ? 'animate-fade-in' : 'opacity-0'}
                  `}
                  style={{ animationDelay: '0.7s' }}
                >
                  <span>{showAllWidgets ? 'Masquer' : 'Voir'} tous les widgets</span>
                  <div className={`p-1 rounded-full bg-[var(--bg-secondary)] group-hover:bg-[var(--primary)] transition-colors duration-300`}>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${showAllWidgets ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Full Widget List */}
              <div className={`transition-all duration-500 ease-in-out ${showAllWidgets ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <WidgetList isVisible={showAllWidgets} />
              </div>
            </div>
          </main>

          {/* Footer - Minimal & Modern */}
          <footer className="border-t border-[var(--border-color)] py-12 px-8 md:px-16 bg-[var(--bg-secondary)]/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-cyan)] flex items-center justify-center text-white font-bold text-xs">
                    BB
                  </div>
                  <span className="text-white font-bold text-lg">BrickByBrick</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Plateforme d'aide à l'investissement locatif pour les jeunes.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-[var(--text-secondary)]">
                <span className="hover:text-white transition-colors cursor-pointer">Données DVF</span>
                <span className="hover:text-white transition-colors cursor-pointer">INSEE</span>
                <span className="hover:text-white transition-colors cursor-pointer">API SNCF</span>
                <span className="hover:text-white transition-colors cursor-pointer">Mentions Légales</span>
              </div>

              <div className="text-sm text-[var(--text-muted)]">
                © 2024-2026 Projet PPE
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
