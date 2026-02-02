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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Sidebar Toggle Button */}
      <SidebarToggle 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content - Adjusted for sidebar */}
      <div 
        className="transition-all duration-300"
        style={{ 
          marginLeft: isSidebarOpen ? '280px' : '0',
          paddingTop: '80px'
        }}
      >
        {/* Hero Section */}
        <header style={{ paddingTop: '60px', paddingBottom: '60px' }}>
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

        {/* Featured: Analyze CTA - More Prominent */}
        <section style={{ padding: '0 48px 80px 48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link href="/analyze" className={`block ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.35s' }}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-cyan-600/20 border-2 border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20" style={{ padding: '48px 56px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-transparent" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-3xl font-bold text-white">Analyseur d'Annonces IA</h3>
                        <span className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-sm font-semibold">NOUVEAU</span>
                      </div>
                      <p className="text-lg text-[var(--text-secondary)]">Collez un lien SeLoger, Leboncoin ou PAP et obtenez une analyse complète avec score sur 100</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg whitespace-nowrap hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                    Analyser maintenant
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className={`text-center mb-20 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '0.4s' }}
            >
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Outils d'analyse
              </div>
              <h2 className="text-5xl font-bold text-white mb-4">Explorez le marché immobilier</h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Découvrez nos widgets interactifs pour analyser les données du marché français
              </p>
            </div>

            {/* Carousel - Hidden when showing all widgets */}
            {!showAllWidgets && (
              <div className={`${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
                <WidgetCarousel />
              </div>
            )}

            {/* Toggle Button for Full List */}
            <div className="flex justify-center mt-12">
              <button
                onClick={() => setShowAllWidgets(!showAllWidgets)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-xl
                  bg-[var(--bg-card)] border border-[var(--border-color)]
                  text-white font-medium
                  hover:bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]
                  transition-all duration-300
                  ${mounted ? 'animate-fade-in' : 'opacity-0'}
                `}
                style={{ animationDelay: '0.6s' }}
              >
                <span>{showAllWidgets ? 'Masquer' : 'Voir'} tous les widgets</span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-300 ${showAllWidgets ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Full Widget List */}
            <div className={`transition-all duration-500 ${showAllWidgets ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              <WidgetList isVisible={showAllWidgets} />
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
    </div>
  );
}
