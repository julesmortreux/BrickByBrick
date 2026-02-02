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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
      {widgets.map((widget) => (
        <Link
          key={widget.id}
          href={widget.status === 'ready' ? widget.href : '#'}
          className={`
            block group h-full
            ${widget.status !== 'ready' ? 'cursor-not-allowed' : ''}
          `}
        >
          <div
            className={`
              relative rounded-3xl overflow-hidden h-full
              bg-[var(--bg-card)] border border-[var(--border-color)]
              transition-all duration-300
              ${widget.status === 'ready' 
                ? 'hover:border-[var(--border-hover)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20' 
                : 'opacity-40'
              }
            `}
            style={{ padding: '32px' }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            {/* Content Wrapper */}
            <div className="relative z-10 flex gap-6">
              {/* Icon Column */}
              <div className="flex-shrink-0">
                <div className={`
                  w-16 h-16 rounded-2xl bg-gradient-to-br ${widget.color}
                  flex items-center justify-center text-white
                  shadow-lg
                  transition-transform duration-300
                  ${widget.status === 'ready' ? 'group-hover:scale-110 group-hover:rotate-3' : ''}
                `}>
                  {WidgetIcons[widget.icon as keyof typeof WidgetIcons]}
                </div>
              </div>

              {/* Text Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-[var(--primary-light)] transition-colors">
                    {widget.title}
                  </h3>
                </div>

                <p className="text-sm text-[var(--text-muted)] font-medium mb-3">
                  {widget.subtitle}
                </p>

                <p className="text-base text-[var(--text-secondary)] line-clamp-2 mb-6">
                  {widget.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors gap-2">
                  Découvrir
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
