'use client';

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
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  map: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  stats: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  coin: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  home: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

interface WidgetListProps {
  isVisible: boolean;
}

export default function WidgetList({ isVisible }: WidgetListProps) {
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 mt-12">
      {widgets.map((widget) => (
        <Link
          key={widget.id}
          href={widget.status === 'ready' ? widget.href : '#'}
          className={`
            block group
            ${widget.status !== 'ready' ? 'cursor-not-allowed' : ''}
          `}
        >
          <div
            className={`
              relative rounded-3xl overflow-hidden
              bg-[var(--bg-card)] border border-[var(--border-color)]
              transition-all duration-300
              ${widget.status === 'ready' 
                ? 'hover:border-[var(--border-hover)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20' 
                : 'opacity-40'
              }
            `}
            style={{ padding: '40px 48px' }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-5`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-6 mb-6">
                {/* Icon */}
                <div className={`
                  w-20 h-20 rounded-2xl bg-gradient-to-br ${widget.color}
                  flex items-center justify-center text-white
                  shadow-lg flex-shrink-0
                  transition-transform duration-300
                  ${widget.status === 'ready' ? 'group-hover:scale-110' : ''}
                `}>
                  {WidgetIcons[widget.icon as keyof typeof WidgetIcons]}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-3xl font-bold text-white">
                      {widget.title}
                    </h3>
                    {widget.status === 'coming' && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-[var(--text-muted)] mb-3">
                    {widget.subtitle}
                  </p>
                  <p className="text-base text-[var(--text-secondary)]">
                    {widget.description}
                  </p>
                </div>

                {/* Arrow */}
                {widget.status === 'ready' && (
                  <div className={`
                    w-12 h-12 rounded-full
                    bg-[var(--bg-secondary)] flex items-center justify-center
                    transition-all duration-300 flex-shrink-0
                    group-hover:bg-gradient-to-br ${widget.color}
                  `}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Preview/Overview Section */}
              <div style={{ height: '200px', position: 'relative', marginTop: '16px' }}>
                {widget.status === 'ready' && (
                  <>
                    {widget.id === 1 && (
                      <div className="flex items-center justify-center h-full">
                        <div className="relative w-40 h-40">
                          <svg className="transform -rotate-90 w-40 h-40">
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="10"
                              fill="none"
                            />
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="url(#gradient1-list)"
                              strokeWidth="10"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 70}`}
                              strokeDashoffset={`${2 * Math.PI * 70 * 0.3}`}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="gradient1-list" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#9333ea" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-white">72</span>
                            <span className="text-sm text-[var(--text-muted)]">Score</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {widget.id === 2 && (
                      <div className="h-full flex items-center justify-center px-4 relative">
                        <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="lineGradient2-list" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                          </defs>
                          <line x1="40" y1="160" x2="360" y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                          <line x1="40" y1="40" x2="40" y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                          <polyline
                            points="60,140 120,110 180,90 240,70 300,50"
                            fill="none"
                            stroke="url(#lineGradient2-list)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {[
                            { x: 60, y: 140 },
                            { x: 120, y: 110 },
                            { x: 180, y: 90 },
                            { x: 240, y: 70 },
                            { x: 300, y: 50 }
                          ].map((point, i) => (
                            <circle
                              key={i}
                              cx={point.x}
                              cy={point.y}
                              r="6"
                              fill="#3b82f6"
                              stroke="rgba(255,255,255,0.5)"
                              strokeWidth="2"
                            />
                          ))}
                          {[2020, 2021, 2022, 2023, 2024].map((year, i) => (
                            <text
                              key={year}
                              x={60 + (i * 60)}
                              y="180"
                              fontSize="12"
                              fill="rgba(255,255,255,0.6)"
                              textAnchor="middle"
                              fontWeight="500"
                            >
                              {year}
                            </text>
                          ))}
                        </svg>
                      </div>
                    )}
                    {widget.id === 3 && (
                      <div className="h-full flex flex-col justify-center gap-4 px-4">
                        {[
                          { label: 'Studio', value: 35, color: '#10b981' },
                          { label: '2p', value: 55, color: '#14b8a6' },
                          { label: '3p', value: 75, color: '#06b6d4' },
                          { label: '4p+', value: 90, color: '#0891b2' }
                        ].map((item, i) => (
                          <div key={item.label} className="flex items-center gap-4">
                            <div className="text-sm text-[var(--text-muted)] font-medium" style={{ minWidth: '60px' }}>
                              {item.label}
                            </div>
                            <div className="flex-1 relative" style={{ height: '28px' }}>
                              <div
                                className="h-full rounded"
                                style={{
                                  width: `${item.value}%`,
                                  background: `linear-gradient(to right, ${item.color}, ${item.color}cc)`,
                                  minWidth: '20px',
                                  borderRadius: '6px'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {widget.id === 4 && (
                      <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '200px' }}>
                          <defs>
                            <linearGradient id="mapGradient-list" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#1a1a24" />
                              <stop offset="100%" stopColor="#12121a" />
                            </linearGradient>
                          </defs>
                          <polygon
                            points="100,30 170,70 170,130 100,170 30,130 30,70"
                            fill="url(#mapGradient-list)"
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
                              r="6"
                              fill={point.color}
                              opacity="0.9"
                              stroke="rgba(255,255,255,0.4)"
                              strokeWidth="2"
                            />
                          ))}
                        </svg>
                      </div>
                    )}
                    {widget.id === 5 && (
                      <div className="h-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '200px' }}>
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
                            r="10"
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
                              r="6"
                              fill={point.color}
                              opacity="0.9"
                              stroke="rgba(255,255,255,0.4)"
                              strokeWidth="2"
                            />
                          ))}
                        </svg>
                      </div>
                    )}
                    {widget.id === 6 && (
                      <div className="h-full flex items-center justify-center gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-emerald-400 mb-2">12%</div>
                          <div className="text-sm text-[var(--text-muted)]">Vacance</div>
                        </div>
                        <div className="h-20 w-px bg-[var(--border-color)]" />
                        <div className="text-center">
                          <div className="text-5xl font-bold text-rose-400 mb-2">8.2%</div>
                          <div className="text-sm text-[var(--text-muted)]">Tension</div>
                        </div>
                      </div>
                    )}
                    {widget.id === 7 && (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="relative w-48 h-24 overflow-hidden">
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
                              stroke="url(#gaugeGradient7-list)"
                              strokeWidth="10"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="gaugeGradient7-list" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                            <span className="text-4xl font-bold text-white">5.8</span>
                            <span className="text-xl text-[var(--text-muted)]">%</span>
                          </div>
                        </div>
                        <div className="text-base text-[var(--text-muted)] mt-4">Rendement requis</div>
                      </div>
                    )}
                    {widget.id === 8 && (
                      <div className="h-full flex flex-col items-center justify-center px-4">
                        <div className="w-full max-w-[300px]">
                          {[
                            { code: '23', pct: 85, color: '#10b981' },
                            { code: '58', pct: 75, color: '#10b981' },
                            { code: '36', pct: 65, color: '#3b82f6' },
                            { code: '03', pct: 55, color: '#3b82f6' },
                            { code: '18', pct: 45, color: '#f59e0b' },
                          ].map((dept, i) => (
                            <div key={dept.code} className="flex items-center gap-3 mb-3">
                              <span className="text-sm text-[var(--text-muted)] w-8">{dept.code}</span>
                              <div className="flex-1 h-6 bg-[var(--bg-secondary)] rounded overflow-hidden">
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
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
