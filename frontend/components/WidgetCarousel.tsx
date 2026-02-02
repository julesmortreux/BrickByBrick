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

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  useEffect(() => {
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

  const visibleWidgets = widgets.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
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
                className={`block ${widget.status !== 'ready' ? 'cursor-not-allowed' : ''}`}
              >
                <div
                  className={`
                    relative rounded-3xl overflow-hidden
                    bg-[var(--bg-card)] border border-[var(--border-color)]
                    transition-all duration-300
                    ${widget.status === 'ready' 
                      ? 'hover:border-[var(--border-hover)] hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30' 
                      : 'opacity-40'
                    }
                  `}
                  style={{ minHeight: '480px', padding: '32px' }}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-5`} />
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-16 h-16 rounded-2xl bg-gradient-to-br ${widget.color}
                          flex items-center justify-center text-white
                          shadow-lg
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

                    {/* Description */}
                    <p className="text-base text-[var(--text-secondary)] mb-6 flex-grow">
                      {widget.description}
                    </p>

                    {/* Preview/Overview Section */}
                    <div className="mb-6" style={{ height: '180px', position: 'relative' }}>
                      {widget.status === 'ready' && (
                        <>
                          {widget.id === 1 && (
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
                            <div className="h-full flex items-center justify-center px-4 relative">
                              <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                  <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                  </linearGradient>
                                </defs>
                                <line x1="30" y1="120" x2="270" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <line x1="30" y1="30" x2="30" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <polyline
                                  points="50,100 90,85 130,70 170,60 210,50"
                                  fill="none"
                                  stroke="url(#lineGradient2)"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
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
                            <div className="h-full flex flex-col justify-center gap-3 px-4">
                              {[
                                { label: 'Studio', value: 35, color: '#10b981' },
                                { label: '2p', value: 55, color: '#14b8a6' },
                                { label: '3p', value: 75, color: '#06b6d4' },
                                { label: '4p+', value: 90, color: '#0891b2' }
                              ].map((item, i) => (
                                <div key={item.label} className="flex items-center gap-3">
                                  <div className="text-xs text-[var(--text-muted)] font-medium" style={{ minWidth: '45px' }}>
                                    {item.label}
                                  </div>
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
                            <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                              <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '180px' }}>
                                <defs>
                                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a1a24" />
                                    <stop offset="100%" stopColor="#12121a" />
                                  </linearGradient>
                                </defs>
                                <polygon
                                  points="100,30 170,70 170,130 100,170 30,130 30,70"
                                  fill="url(#mapGradient)"
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="2.5"
                                />
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
                                  />
                                ))}
                              </svg>
                            </div>
                          )}
                          {widget.id === 5 && (
                            <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                              <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '180px' }}>
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="60"
                                  fill="none"
                                  stroke="rgba(59, 130, 246, 0.3)"
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                />
                                <circle
                                  cx="100"
                                  cy="100"
                                  r="8"
                                  fill="#ef4444"
                                  stroke="white"
                                  strokeWidth="2"
                                />
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
                                  />
                                ))}
                              </svg>
                            </div>
                          )}
                          {widget.id === 6 && (
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
                            <div className="h-full flex flex-col items-center justify-center">
                              <div className="relative w-36 h-20 overflow-hidden">
                                <svg className="w-full h-full" viewBox="0 0 120 70">
                                  <path
                                    d="M 10 60 A 50 50 0 0 1 110 60"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                  />
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
                            </div>
                          )}
                          {widget.id === 8 && (
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
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    {widget.status === 'ready' && (
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">En savoir plus</span>
                        <div className={`
                          w-10 h-10 rounded-full
                          bg-[var(--bg-secondary)] flex items-center justify-center
                          transition-all duration-300
                          group-hover:bg-gradient-to-br ${widget.color}
                        `}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {maxIndex > 0 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-all shadow-lg"
            aria-label="Précédent"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-all shadow-lg"
            aria-label="Suivant"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${currentIndex === index 
                  ? 'bg-white w-8' 
                  : 'bg-[var(--text-muted)] hover:bg-[var(--text-secondary)]'
                }
              `}
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
