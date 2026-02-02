'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
];

// SVG Icons
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
  home: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

export default function WidgetCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate how many widgets to show based on screen size
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1; // Mobile
    if (width < 1024) return 2; // Tablette
    return 3; // Desktop
  };

  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    // Initial calculation
    setItemsPerView(getItemsPerView());

    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, widgets.length - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, itemsPerView]);

  const maxIndex = Math.max(0, widgets.length - itemsPerView);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-[32px] p-2 -m-2">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="flex-shrink-0"
              style={{ width: `${100 / itemsPerView}%`, padding: '0 12px' }}
            >
              <Link
                href={widget.status === 'ready' ? widget.href : '#'}
                className={`block h-full ${widget.status !== 'ready' ? 'cursor-not-allowed' : ''}`}
              >
                <div
                  className={`
                    group relative rounded-3xl overflow-hidden h-full
                    bg-[var(--bg-card)] border border-[var(--border-color)]
                    transition-all duration-300
                    ${widget.status === 'ready' 
                      ? 'hover:border-[var(--border-hover)] hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40'
                      : 'opacity-40'
                    }
                  `}
                  style={{ minHeight: '480px' }}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Top Highlight Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${widget.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10 flex flex-col h-full p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-16 h-16 rounded-2xl bg-gradient-to-br ${widget.color}
                          flex items-center justify-center text-white
                          shadow-lg shadow-black/20
                          transition-all duration-500
                          group-hover:scale-110 group-hover:rotate-3
                        `}>
                          {WidgetIcons[widget.icon as keyof typeof WidgetIcons]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--primary-light)] transition-colors">
                            {widget.title}
                          </h3>
                          <p className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                            {widget.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Section - SVG Visualizations */}
                    <div className="flex-1 flex items-center justify-center mb-8 relative">
                      <div className="w-full h-40 relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        {widget.status === 'ready' && (
                          <>
                            {widget.id === 1 && ( // Faisabilité
                              <div className="relative w-32 h-32">
                                <svg className="transform -rotate-90 w-32 h-32 drop-shadow-lg">
                                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                                  <circle cx="64" cy="64" r="56" stroke="url(#g1)" strokeWidth="8" fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * 0.25}`} strokeLinecap="round" />
                                  <defs>
                                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#8b5cf6" />
                                      <stop offset="100%" stopColor="#c084fc" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-3xl font-bold text-white">75</span>
                                  <span className="text-xs text-[var(--text-muted)]">Score</span>
                                </div>
                              </div>
                            )}
                            {widget.id === 2 && ( // DVF
                              <div className="w-full px-4 h-full flex items-center">
                                <svg width="100%" height="100" viewBox="0 0 300 100" className="drop-shadow-lg">
                                  <path d="M10,80 Q70,70 140,50 T290,20" fill="none" stroke="url(#g2)" strokeWidth="4" strokeLinecap="round" />
                                  <circle cx="290" cy="20" r="6" fill="#22d3ee" stroke="white" strokeWidth="2" />
                                  <defs>
                                    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              </div>
                            )}
                            {widget.id === 3 && ( // Taille
                              <div className="w-full px-6 flex flex-col gap-3">
                                {[
                                  { l: 'T2', w: '70%', c: '#10b981' },
                                  { l: 'T3', w: '45%', c: '#14b8a6' },
                                  { l: 'Studio', w: '30%', c: '#06b6d4' }
                                ].map((i, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <span className="text-xs text-[var(--text-muted)] w-8">{i.l}</span>
                                    <div className="h-2 rounded-full flex-1 bg-[var(--bg-secondary)] overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: i.w, backgroundColor: i.c }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {widget.id === 4 && ( // Map
                                <div className="relative">
                                    <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-lg opacity-80">
                                        <path d="M50,10 L90,30 L90,70 L50,90 L10,70 L10,30 Z" fill="none" stroke="#f59e0b" strokeWidth="2" />
                                        <circle cx="50" cy="50" r="4" fill="#f59e0b" />
                                        <circle cx="50" cy="50" r="20" fill="#f59e0b" fillOpacity="0.2" className="animate-pulse" />
                                        <circle cx="70" cy="40" r="3" fill="#ffffff" fillOpacity="0.5" />
                                        <circle cx="30" cy="60" r="3" fill="#ffffff" fillOpacity="0.5" />
                                    </svg>
                                </div>
                            )}
                            {widget.id === 5 && ( // Proximité
                                <div className="relative">
                                    <div className="absolute inset-0 bg-lime-500/20 rounded-full animate-ping opacity-20"></div>
                                    <div className="w-24 h-24 rounded-full border-2 border-lime-500/30 flex items-center justify-center bg-lime-500/5 backdrop-blur-sm">
                                        <svg className="w-10 h-10 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                            {widget.id === 6 && ( // Tension
                                <div className="flex gap-4 items-end h-24">
                                    <div className="w-8 bg-[var(--bg-secondary)] rounded-t-lg h-12 relative group-hover:h-16 transition-all duration-500">
                                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-rose-500/20 to-rose-500/60 rounded-t-lg"></div>
                                    </div>
                                    <div className="w-8 bg-[var(--bg-secondary)] rounded-t-lg h-20 relative group-hover:h-24 transition-all duration-500">
                                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-rose-500/40 to-rose-500 rounded-t-lg"></div>
                                    </div>
                                    <div className="w-8 bg-[var(--bg-secondary)] rounded-t-lg h-16 relative group-hover:h-14 transition-all duration-500">
                                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-rose-500/20 to-rose-500/60 rounded-t-lg"></div>
                                    </div>
                                </div>
                            )}
                            {widget.id === 7 && ( // Rendement Requis
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <path d="M 50 5 A 45 45 0 1 1 25 82" fill="none" stroke="url(#g7)" strokeWidth="8" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#818cf8" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute text-2xl font-bold text-indigo-400">6.2%</div>
                                </div>
                            )}
                            {widget.id === 8 && ( // Rendement Dept
                                <div className="w-full px-6 flex flex-col gap-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-md bg-sky-500/20 flex items-center justify-center text-xs text-sky-400 font-bold">{i}</div>
                                            <div className="flex-1 h-8 bg-[var(--bg-secondary)] rounded-md flex items-center px-3 border border-[var(--border-color)]">
                                                <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${80 - i * 15}%`}}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-base text-[var(--text-secondary)] mb-8 line-clamp-2">
                      {widget.description}
                    </p>

                    {/* Footer / CTA */}
                    <div className="mt-auto pt-6 border-t border-[var(--border-color)] flex items-center justify-between group-hover:border-white/10 transition-colors">
                      <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">Explorer</span>
                      <div className={`
                        w-10 h-10 rounded-full
                        bg-[var(--bg-secondary)] border border-[var(--border-color)]
                        flex items-center justify-center
                        transition-all duration-300
                        group-hover:bg-gradient-to-br group-hover:${widget.color} group-hover:border-transparent
                        group-hover:scale-110
                      `}>
                        <svg className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows (Custom design) */}
      <button
        onClick={goToPrevious}
        className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-white flex items-center justify-center hover:bg-[var(--bg-secondary)] hover:scale-110 transition-all duration-300 shadow-xl shadow-black/20"
        aria-label="Précédent"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-white flex items-center justify-center hover:bg-[var(--bg-secondary)] hover:scale-110 transition-all duration-300 shadow-xl shadow-black/20"
        aria-label="Suivant"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-3 mt-12">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              h-2 rounded-full transition-all duration-500
              ${currentIndex === index
                ? 'w-10 bg-[var(--primary-light)]'
                : 'w-2 bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
              }
            `}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
