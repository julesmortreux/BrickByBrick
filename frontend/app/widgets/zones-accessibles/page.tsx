'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';

const CONTAINER = { maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 48, paddingRight: 48 } as const;
const CTA_STYLE = { background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 40, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '14px 32px', fontSize: '1rem', lineHeight: 1 } as const;
import dynamic from 'next/dynamic';

// Import dynamique du composant Map pour éviter les erreurs SSR
const MapComponent = dynamic(
  () => import('@/components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
        Chargement de la carte...
      </div>
    )
  }
);

// Hook de debounce personnalisé
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Types
interface ZoneBudgetAccessible {
  code_postal: string;
  commune?: string;
  pct_access: number;
  lat?: number;
  lon?: number;
  prix_median?: number;
  nb_ventes?: number;
}

interface MarketDataResponse {
  scope_france: {
    carte_budget_accessible?: ZoneBudgetAccessible[];
  };
}

// Départements français
const DEPARTEMENTS = [
  { code: '', nom: 'France entière' },
  { code: '01', nom: 'Ain' }, { code: '02', nom: 'Aisne' }, { code: '03', nom: 'Allier' },
  { code: '04', nom: 'Alpes-de-Haute-Provence' }, { code: '05', nom: 'Hautes-Alpes' }, { code: '06', nom: 'Alpes-Maritimes' },
  { code: '07', nom: 'Ardèche' }, { code: '08', nom: 'Ardennes' }, { code: '09', nom: 'Ariège' },
  { code: '10', nom: 'Aube' }, { code: '11', nom: 'Aude' }, { code: '12', nom: 'Aveyron' },
  { code: '13', nom: 'Bouches-du-Rhône' }, { code: '14', nom: 'Calvados' }, { code: '15', nom: 'Cantal' },
  { code: '16', nom: 'Charente' }, { code: '17', nom: 'Charente-Maritime' }, { code: '18', nom: 'Cher' },
  { code: '19', nom: 'Corrèze' }, { code: '21', nom: "Côte-d'Or" }, { code: '22', nom: "Côtes-d'Armor" },
  { code: '23', nom: 'Creuse' }, { code: '24', nom: 'Dordogne' }, { code: '25', nom: 'Doubs' },
  { code: '26', nom: 'Drôme' }, { code: '27', nom: 'Eure' }, { code: '28', nom: 'Eure-et-Loir' },
  { code: '29', nom: 'Finistère' }, { code: '30', nom: 'Gard' }, { code: '31', nom: 'Haute-Garonne' },
  { code: '32', nom: 'Gers' }, { code: '33', nom: 'Gironde' }, { code: '34', nom: 'Hérault' },
  { code: '35', nom: 'Ille-et-Vilaine' }, { code: '36', nom: 'Indre' }, { code: '37', nom: 'Indre-et-Loire' },
  { code: '38', nom: 'Isère' }, { code: '39', nom: 'Jura' }, { code: '40', nom: 'Landes' },
  { code: '41', nom: 'Loir-et-Cher' }, { code: '42', nom: 'Loire' }, { code: '43', nom: 'Haute-Loire' },
  { code: '44', nom: 'Loire-Atlantique' }, { code: '45', nom: 'Loiret' }, { code: '46', nom: 'Lot' },
  { code: '47', nom: 'Lot-et-Garonne' }, { code: '48', nom: 'Lozère' }, { code: '49', nom: 'Maine-et-Loire' },
  { code: '50', nom: 'Manche' }, { code: '51', nom: 'Marne' }, { code: '52', nom: 'Haute-Marne' },
  { code: '53', nom: 'Mayenne' }, { code: '54', nom: 'Meurthe-et-Moselle' }, { code: '55', nom: 'Meuse' },
  { code: '56', nom: 'Morbihan' }, { code: '57', nom: 'Moselle' }, { code: '58', nom: 'Nièvre' },
  { code: '59', nom: 'Nord' }, { code: '60', nom: 'Oise' }, { code: '61', nom: 'Orne' },
  { code: '62', nom: 'Pas-de-Calais' }, { code: '63', nom: 'Puy-de-Dôme' }, { code: '64', nom: 'Pyrénées-Atlantiques' },
  { code: '65', nom: 'Hautes-Pyrénées' }, { code: '66', nom: 'Pyrénées-Orientales' }, { code: '67', nom: 'Bas-Rhin' },
  { code: '68', nom: 'Haut-Rhin' }, { code: '69', nom: 'Rhône' }, { code: '70', nom: 'Haute-Saône' },
  { code: '71', nom: 'Saône-et-Loire' }, { code: '72', nom: 'Sarthe' }, { code: '73', nom: 'Savoie' },
  { code: '74', nom: 'Haute-Savoie' }, { code: '75', nom: 'Paris' }, { code: '76', nom: 'Seine-Maritime' },
  { code: '77', nom: 'Seine-et-Marne' }, { code: '78', nom: 'Yvelines' }, { code: '79', nom: 'Deux-Sèvres' },
  { code: '80', nom: 'Somme' }, { code: '81', nom: 'Tarn' }, { code: '82', nom: 'Tarn-et-Garonne' },
  { code: '83', nom: 'Var' }, { code: '84', nom: 'Vaucluse' }, { code: '85', nom: 'Vendée' },
  { code: '86', nom: 'Vienne' }, { code: '87', nom: 'Haute-Vienne' }, { code: '88', nom: 'Vosges' },
  { code: '89', nom: 'Yonne' }, { code: '90', nom: 'Territoire de Belfort' }, { code: '91', nom: 'Essonne' },
  { code: '92', nom: 'Hauts-de-Seine' }, { code: '93', nom: 'Seine-Saint-Denis' }, { code: '94', nom: 'Val-de-Marne' },
  { code: '95', nom: "Val-d'Oise" },
];

// Icons
const Icons = {
  map: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
};

export default function ZonesAccessiblesPage() {
  const { user, isAuthenticated } = useAuth();

  const [budget, setBudget] = useState(150000);
  const [typeBien, setTypeBien] = useState<'Tous' | 'Appartement' | 'Maison'>('Tous');
  const [departement, setDepartement] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [zonesData, setZonesData] = useState<ZoneBudgetAccessible[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Debounce des valeurs pour éviter trop d'appels API
  const debouncedBudget = useDebounce(budget, 500);
  const debouncedTypeBien = useDebounce(typeBien, 300);
  const debouncedDepartement = useDebounce(departement, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Charger les préférences
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data.prix_projet) setBudget(data.prix_projet);
          if (data.w4_type_bien) setTypeBien(data.w4_type_bien);
          if (data.w4_departement !== undefined) setDepartement(data.w4_departement);
        }
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  // Charger les données depuis l'API (avec valeurs debounced)
  useEffect(() => {
    const fetchZonesData = async () => {
      setIsLoadingData(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const url = new URL(`${apiUrl}/api/market-data`);

        url.searchParams.set('budget_max', debouncedBudget.toString());
        if (debouncedTypeBien !== 'Tous') {
          url.searchParams.set('type_bien', debouncedTypeBien);
        }
        // Passer le filtre département au backend
        if (debouncedDepartement) {
          url.searchParams.set('dept_filter', debouncedDepartement);
        }

        const response = await fetch(url.toString());

        if (response.ok) {
          const data: MarketDataResponse = await response.json();

          if (data.scope_france?.carte_budget_accessible) {
            // Filtrer les zones avec coordonnées valides
            let zones = data.scope_france.carte_budget_accessible.filter(
              zone => zone.lat && zone.lon && !isNaN(zone.lat) && !isNaN(zone.lon)
            );

            // Double vérification: filtrer par département côté client
            if (debouncedDepartement) {
              zones = zones.filter(zone => zone.code_postal.startsWith(debouncedDepartement));
            }

            setZonesData(zones);
          } else {
            setZonesData([]);
          }
        } else {
          setZonesData([]);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setZonesData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (mounted && debouncedBudget > 0) {
      fetchZonesData();
    }
  }, [debouncedBudget, debouncedTypeBien, debouncedDepartement, mounted]);

  // Statistiques par catégorie
  const stats = useMemo(() => {
    if (zonesData.length === 0) {
      return { total: 0, tresAccessibles: 0, accessibles: 0, limites: 0, peuAccessibles: 0, maxVentes: 1 };
    }

    return {
      total: zonesData.length,
      tresAccessibles: zonesData.filter(z => z.pct_access >= 75).length,
      accessibles: zonesData.filter(z => z.pct_access >= 50 && z.pct_access < 75).length,
      limites: zonesData.filter(z => z.pct_access >= 25 && z.pct_access < 50).length,
      peuAccessibles: zonesData.filter(z => z.pct_access < 25).length,
      maxVentes: Math.max(...zonesData.map(z => z.nb_ventes || 1)),
    };
  }, [zonesData]);

  // Centre de la carte
  const mapCenter = useMemo(() => {
    if (zonesData.length === 0) {
      return { lat: 46.5, lon: 2.5, zoom: 6 };
    }

    const avgLat = zonesData.reduce((sum, z) => sum + (z.lat || 0), 0) / zonesData.length;
    const avgLon = zonesData.reduce((sum, z) => sum + (z.lon || 0), 0) / zonesData.length;
    const zoom = departement ? 9 : 6;

    return { lat: avgLat, lon: avgLon, zoom };
  }, [zonesData, departement]);


  const deptInfo = DEPARTEMENTS.find(d => d.code === departement);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-600/10 to-transparent" style={{ paddingTop: 72 }}>
        <div style={{ ...CONTAINER, paddingTop: 64, paddingBottom: 56, textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Outil • Zones accessibles
          </div>
          <div aria-hidden style={{ height: 22 }} />
          <h1 className="text-5xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Zones Accessibles</h1>
          <div aria-hidden style={{ height: 14 }} />
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
            Visualisez toutes les zones selon votre budget — des plus accessibles aux moins accessibles. Les paramètres de référence se modifient dans les réglages.
          </p>
          <div aria-hidden style={{ height: 30 }} />
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={CTA_STYLE}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ ...CONTAINER, paddingTop: 0, paddingBottom: 96 }}>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ marginBottom: '40px' }}>

          {/* Budget */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex justify-between items-baseline mb-6">
              <label className="text-lg font-medium text-white">Budget maximum</label>
              <span className="text-3xl font-bold text-white">{(budget / 1000).toFixed(0)}k €</span>
            </div>
            <div style={{ height: '30px' }}></div>
            <div style={{ padding: '0 8px' }}>
              <Slider
                value={[budget]}
                onValueChange={(v) => setBudget(v[0])}
                min={50000}
                max={500000}
                step={10000}
              />
            </div>
            <div style={{ height: '30px' }}></div>
            <div className="flex justify-between text-sm text-[var(--text-muted)] mt-4">
              <span>50 000 €</span>
              <span>500 000 €</span>
            </div>
            <div style={{ height: '30px' }}></div>
          </div>

          {/* Type de bien */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <label className="text-lg font-medium text-white block mb-6">Type de bien</label>
            <div style={{ height: '20px' }}></div>
            <div className="flex flex-col gap-2">
              {(['Tous', 'Appartement', 'Maison'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeBien(type)}
                  className={`w-full rounded-2xl text-left font-medium transition-all ${
                    typeBien === type
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/30'
                      : 'bg-amber-500/10 border border-amber-500/20 text-[var(--text-secondary)] hover:bg-amber-500/15'
                  }`}
                  style={{ padding: '12px 20px' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Département */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <label className="text-lg font-medium text-white block mb-6">Département</label>
            <div style={{ height: '20px' }}></div>
            <select
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '24px' }}
            >
              {DEPARTEMENTS.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.code ? `${dept.code} - ${dept.nom}` : dept.nom}
                </option>
              ))}
            </select>
            <p className="text-sm text-[var(--text-muted)] mt-4">
              Sélectionnez un département pour zoomer
            </p>
          </div>
        </div>

        {/* Stats & Map */}
        {isLoadingData ? (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] text-center" style={{ padding: '80px' }}>
            <div className="text-[var(--text-muted)] text-lg">Chargement des données...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Map */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {deptInfo?.nom || 'France entière'}
                  </h2>
                  <div style={{ height: '10px' }}></div>
                  <p className="text-[var(--text-muted)]">
                    {typeBien} • Budget ≤ {budget.toLocaleString()} €
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  {Icons.map}
                </div>
              </div>
              <div style={{ height: '20px' }}></div>

              {mounted && zonesData.length > 0 ? (
                <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]" style={{ position: 'relative' }}>
                  <MapComponent
                    zonesData={zonesData}
                    mapCenter={mapCenter}
                    budget={budget}
                    maxVentes={stats.maxVentes}
                    departement={departement}
                  />
                  {/* Dark gradient overlay at the bottom */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '120px',
                      background: 'linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.7) 50%, transparent 100%)',
                      pointerEvents: 'none',
                      borderRadius: '0 0 16px 16px',
                      zIndex: 1000,
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
                  {zonesData.length === 0 ? 'Aucune zone trouvée avec ces critères' : 'Chargement de la carte...'}
                </div>
              )}

              {/* Légende */}
              <div className="flex justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <span className="text-sm text-[var(--text-secondary)]">≥75% Très accessible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-sm text-[var(--text-secondary)]">50-74% Accessible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  <span className="text-sm text-[var(--text-secondary)]">25-49% Limite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  <span className="text-sm text-[var(--text-secondary)]">&lt;25% Peu accessible</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <h3 className="text-xl font-bold text-white mb-8">Répartition des zones</h3>
              <div style={{ height: '30px' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🟢</span>
                    <span className="text-[var(--text-secondary)]">Très accessible</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">{stats.tresAccessibles}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔵</span>
                    <span className="text-[var(--text-secondary)]">Accessible</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{stats.accessibles}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🟡</span>
                    <span className="text-[var(--text-secondary)]">Limite</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">{stats.limites}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔴</span>
                    <span className="text-[var(--text-secondary)]">Peu accessible</span>
                  </div>
                  <span className="text-2xl font-bold text-rose-400">{stats.peuAccessibles}</span>
                </div>

                <div className="h-px bg-[var(--border-color)]" />

                <div className="flex items-center justify-between">
                  <span className="text-lg text-[var(--text-secondary)]">Total zones</span>
                  <span className="text-3xl font-bold text-white">{stats.total}</span>
                </div>
                <div style={{ height: '10px' }}></div>
              </div>

              {stats.peuAccessibles > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl mt-8" style={{ padding: '20px' }}>
                  <p className="text-rose-400 text-sm">
                    🔴 {stats.peuAccessibles} zone{stats.peuAccessibles > 1 ? 's' : ''} peu accessible{stats.peuAccessibles > 1 ? 's' : ''} avec ce budget
                  </p>
                </div>
              )}
              <div style={{ height: '20px' }}></div>
              {stats.tresAccessibles > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mt-4" style={{ padding: '20px' }}>
                  <p className="text-emerald-400 text-sm">
                    🟢 {stats.tresAccessibles} zone{stats.tresAccessibles > 1 ? 's' : ''} très accessible{stats.tresAccessibles > 1 ? 's' : ''} !
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', paddingTop: 64, paddingBottom: 96, background: 'linear-gradient(to top, rgba(245,158,11,0.06), transparent)' }}>
        <div style={{ ...CONTAINER, textAlign: 'center' }}>
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={{ ...CTA_STYLE, padding: '18px 44px', fontSize: '1.05rem' }}>
            Retour au tableau de bord
          </Link>
          <div aria-hidden style={{ height: 14 }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pour modifier vos informations de référence, rendez-vous dans <span className="text-white/80">Paramètres</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
