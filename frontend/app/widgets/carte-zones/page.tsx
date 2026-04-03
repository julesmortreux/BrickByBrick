'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';

const CONTAINER = { maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 48, paddingRight: 48 } as const;
const CTA_STYLE = { background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 40, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '14px 32px', fontSize: '1rem', lineHeight: 1 } as const;

// Données des régions/départements avec leurs prix moyens et coordonnées
const regions = [
  { id: '75', nom: 'Paris', prixMoyen: 10500, lat: 48.85, lng: 2.35, population: '2.2M', etudiants: 350000 },
  { id: '92', nom: 'Hauts-de-Seine', prixMoyen: 7200, lat: 48.85, lng: 2.20, population: '1.6M', etudiants: 120000 },
  { id: '93', nom: 'Seine-Saint-Denis', prixMoyen: 4200, lat: 48.93, lng: 2.48, population: '1.6M', etudiants: 80000 },
  { id: '94', nom: 'Val-de-Marne', prixMoyen: 5100, lat: 48.77, lng: 2.47, population: '1.4M', etudiants: 65000 },
  { id: '69', nom: 'Rhône (Lyon)', prixMoyen: 4000, lat: 45.75, lng: 4.85, population: '1.9M', etudiants: 175000 },
  { id: '13', nom: 'Bouches-du-Rhône', prixMoyen: 3500, lat: 43.29, lng: 5.37, population: '2.0M', etudiants: 100000 },
  { id: '33', nom: 'Gironde (Bordeaux)', prixMoyen: 4200, lat: 44.84, lng: -0.58, population: '1.6M', etudiants: 120000 },
  { id: '31', nom: 'Haute-Garonne', prixMoyen: 3800, lat: 43.60, lng: 1.44, population: '1.4M', etudiants: 130000 },
  { id: '59', nom: 'Nord (Lille)', prixMoyen: 2700, lat: 50.63, lng: 3.06, population: '2.6M', etudiants: 180000 },
  { id: '44', nom: 'Loire-Atlantique', prixMoyen: 4500, lat: 47.22, lng: -1.55, population: '1.4M', etudiants: 70000 },
  { id: '34', nom: 'Hérault (Montpellier)', prixMoyen: 3200, lat: 43.61, lng: 3.87, population: '1.2M', etudiants: 85000 },
  { id: '06', nom: 'Alpes-Maritimes', prixMoyen: 5500, lat: 43.70, lng: 7.26, population: '1.1M', etudiants: 40000 },
  { id: '67', nom: 'Bas-Rhin (Strasbourg)', prixMoyen: 3000, lat: 48.58, lng: 7.75, population: '1.1M', etudiants: 65000 },
  { id: '38', nom: 'Isère (Grenoble)', prixMoyen: 2800, lat: 45.19, lng: 5.73, population: '1.3M', etudiants: 75000 },
  { id: '54', nom: 'Meurthe-et-Moselle', prixMoyen: 1800, lat: 48.69, lng: 6.18, population: '733K', etudiants: 50000 },
  { id: '35', nom: 'Ille-et-Vilaine (Rennes)', prixMoyen: 3500, lat: 48.11, lng: -1.67, population: '1.1M', etudiants: 70000 },
  { id: '63', nom: 'Puy-de-Dôme', prixMoyen: 2200, lat: 45.78, lng: 3.08, population: '660K', etudiants: 40000 },
  { id: '21', nom: 'Côte-d\'Or (Dijon)', prixMoyen: 2500, lat: 47.32, lng: 5.04, population: '535K', etudiants: 40000 },
];

// Budget préconfiguré pour calculer l'accessibilité
const calculateAccessibility = (budget: number, surface: number, prixMoyen: number) => {
  const prixTotal = prixMoyen * surface;
  if (budget >= prixTotal) return 'accessible';
  if (budget >= prixTotal * 0.8) return 'limite';
  return 'inaccessible';
};

export default function CarteZonesPage() {
  const [budget, setBudget] = useState(150000);
  const [surfaceCible, setSurfaceCible] = useState(30);

  // Calcul des zones accessibles
  const zonesWithStatus = useMemo(() => {
    return regions.map(region => {
      const status = calculateAccessibility(budget, surfaceCible, region.prixMoyen);
      const prixEstime = region.prixMoyen * surfaceCible;
      const ecartBudget = ((prixEstime - budget) / budget * 100).toFixed(0);
      
      return {
        ...region,
        status,
        prixEstime,
        ecartBudget: Number(ecartBudget),
      };
    });
  }, [budget, surfaceCible]);

  // Stats
  const accessibleCount = zonesWithStatus.filter(z => z.status === 'accessible').length;
  const limiteCount = zonesWithStatus.filter(z => z.status === 'limite').length;
  const totalEtudiants = zonesWithStatus
    .filter(z => z.status === 'accessible')
    .reduce((sum, z) => sum + z.etudiants, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accessible': return 'bg-emerald-500';
      case 'limite': return 'bg-amber-500';
      default: return 'bg-rose-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'accessible': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'limite': return 'bg-amber-500/20 border-amber-500/30';
      default: return 'bg-rose-500/20 border-rose-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-600/10 to-transparent" style={{ paddingTop: 72 }}>
        <div style={{ ...CONTAINER, paddingTop: 64, paddingBottom: 56, textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Outil • Carte des zones
          </div>
          <div aria-hidden style={{ height: 22 }} />
          <h1 className="text-5xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Carte des Zones Accessibles</h1>
          <div aria-hidden style={{ height: 14 }} />
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
            Visualisez quelles métropoles sont accessibles avec votre budget, filtrées par surface cible et prix au m².
          </p>
          <div aria-hidden style={{ height: 30 }} />
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={CTA_STYLE}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      <main style={{ ...CONTAINER, paddingTop: 0, paddingBottom: 0 }}>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" style={{ paddingTop: 48 }}>
          {/* Budget */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-[var(--text-secondary)]">Budget total</label>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{(budget / 1000).toFixed(0)}</span>
                <span className="text-lg text-[var(--text-muted)]">k €</span>
              </div>
            </div>
            
            <Slider
              value={[budget]}
              onValueChange={(v) => setBudget(v[0])}
              min={50000}
              max={400000}
              step={10000}
              className="w-full"
            />
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {[80000, 120000, 150000, 200000, 300000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setBudget(preset)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${budget === preset 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}
                  `}
                >
                  {(preset / 1000)}k €
                </button>
              ))}
            </div>
          </div>

          {/* Surface */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-[var(--text-secondary)]">Surface recherchée</label>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{surfaceCible}</span>
                <span className="text-lg text-[var(--text-muted)]">m²</span>
              </div>
            </div>
            
            <Slider
              value={[surfaceCible]}
              onValueChange={(v) => setSurfaceCible(v[0])}
              min={15}
              max={100}
              step={5}
              className="w-full"
            />
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {[20, 30, 40, 50, 70].map(preset => (
                <button
                  key={preset}
                  onClick={() => setSurfaceCible(preset)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${surfaceCible === preset 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}
                  `}
                >
                  {preset} m²
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400">{accessibleCount}</div>
            <div className="text-sm text-[var(--text-muted)]">Zones accessibles</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-amber-400">{limiteCount}</div>
            <div className="text-sm text-[var(--text-muted)]">Zones limites</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-white">{(totalEtudiants / 1000).toFixed(0)}k</div>
            <div className="text-sm text-[var(--text-muted)]">Étudiants couverts</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-white">{(budget / surfaceCible).toLocaleString()}</div>
            <div className="text-sm text-[var(--text-muted)]">€/m² max</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500" />
            <span className="text-sm text-[var(--text-secondary)]">Accessible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-sm text-[var(--text-secondary)]">Limite (-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-rose-500" />
            <span className="text-sm text-[var(--text-secondary)]">Hors budget</span>
          </div>
        </div>

        {/* Map Visualization (Grid) */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-lg font-semibold text-white mb-6">Pôles Étudiants par Accessibilité</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {zonesWithStatus
              .sort((a, b) => {
                const order = { accessible: 0, limite: 1, inaccessible: 2 };
                return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
              })
              .map((zone) => (
                <div
                  key={zone.id}
                  className={`
                    p-4 rounded-xl border transition-all hover:scale-[1.02]
                    ${getStatusBgColor(zone.status)}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-xs text-[var(--text-muted)]">{zone.id}</div>
                      <div className="font-semibold text-white text-sm">{zone.nom}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(zone.status)}`} />
                  </div>
                  
                  <div className="space-y-1 text-xs text-[var(--text-muted)]">
                    <div className="flex justify-between">
                      <span>Prix/m²</span>
                      <span className="text-white">{zone.prixMoyen.toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix {surfaceCible}m²</span>
                      <span className={zone.status === 'accessible' ? 'text-emerald-400' : zone.status === 'limite' ? 'text-amber-400' : 'text-rose-400'}>
                        {zone.prixEstime.toLocaleString()} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Étudiants</span>
                      <span className="text-white">{(zone.etudiants / 1000).toFixed(0)}k</span>
                    </div>
                  </div>

                  {zone.status !== 'accessible' && (
                    <div className={`mt-2 text-xs ${zone.status === 'limite' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {zone.ecartBudget > 0 ? `+${zone.ecartBudget}%` : `${zone.ecartBudget}%`} du budget
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">💡</span>
            Recommandations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zonesWithStatus
              .filter(z => z.status === 'accessible')
              .sort((a, b) => b.etudiants - a.etudiants)
              .slice(0, 4)
              .map((zone, i) => (
                <div key={zone.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{zone.nom}</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {(zone.etudiants / 1000).toFixed(0)}k étudiants • {zone.prixMoyen.toLocaleString()} €/m²
                    </div>
                    <div className="text-xs text-emerald-400 mt-1">
                      Économie : {(budget - zone.prixEstime).toLocaleString()} € vs budget
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', paddingTop: 64, paddingBottom: 96, background: 'linear-gradient(to top, rgba(245,158,11,0.06), transparent)' }}>
        <div style={{ ...CONTAINER, textAlign: 'center' }}>
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={{ ...CTA_STYLE, padding: '18px 44px', fontSize: '1.05rem' }}>
            Retour au tableau de bord
          </Link>
          <div aria-hidden style={{ height: 14 }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Les données sont calculées à partir de prix moyens du marché. Ajustez votre profil dans les <span className="text-white/80">Paramètres</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
