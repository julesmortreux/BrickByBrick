'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Types
interface DepartementRendement {
  departement: string;
  prix_m2_median: number;
  loyer_m2_moyen: number;
  rendement_brut_pct: number;
  nb_ventes: number;
}

interface MarketDataResponse {
  scope_france: {
    rendement_departements: DepartementRendement[];
  };
}

// Icons
const Icons = {
  trophy: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  chart: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  medal: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  coin: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// Mapping des codes département vers les noms
const DEPARTEMENTS: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
  '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '21': "Côte-d'Or",
  '22': "Côtes-d'Armor", '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme',
  '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
  '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault',
  '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique',
  '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle',
  '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin',
  '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie',
  '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var',
  '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges',
  '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise", '971': 'Guadeloupe',
  '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte'
};

// Obtenir le nom du département
const getNomDepartement = (code: string): string => {
  return DEPARTEMENTS[code] || code;
};

// Obtenir la couleur selon le rendement
const getColorByRendement = (rendement: number): string => {
  if (rendement >= 7) return '#10b981'; // Vert - Excellent
  if (rendement >= 5) return '#3b82f6'; // Bleu - Bon
  if (rendement >= 4) return '#f59e0b'; // Orange - Moyen
  return '#ef4444'; // Rouge - Faible
};

const getRendementLabel = (rendement: number): string => {
  if (rendement >= 7) return 'Excellent';
  if (rendement >= 5) return 'Bon';
  if (rendement >= 4) return 'Moyen';
  return 'Faible';
};

type RendementFilter = 'all' | 'excellent' | 'bon' | 'moyen' | 'faible';

export default function RendementDepartementPage() {
  const { user, isAuthenticated, logout } = useAuth();

  const [rendementData, setRendementData] = useState<DepartementRendement[]>([]);
  const [rendementFilter, setRendementFilter] = useState<RendementFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Charger les données de rendement
  useEffect(() => {
    const fetchRendementData = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/market-data`);

        if (response.ok) {
          const data: MarketDataResponse = await response.json();
          if (data.scope_france?.rendement_departements) {
            // Trier par rendement décroissant
            const sorted = [...data.scope_france.rendement_departements].sort(
              (a, b) => b.rendement_brut_pct - a.rendement_brut_pct
            );
            setRendementData(sorted);
          }
        }
      } catch (error) {
        console.error('Erreur chargement données rendement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      fetchRendementData();
    }
  }, [mounted]);

  // Filtrer et préparer les données pour le graphique
  const chartData = useMemo(() => {
    let filtered = [...rendementData];

    // Appliquer le filtre
    if (rendementFilter === 'excellent') {
      filtered = filtered.filter(d => d.rendement_brut_pct >= 7);
    } else if (rendementFilter === 'bon') {
      filtered = filtered.filter(d => d.rendement_brut_pct >= 5 && d.rendement_brut_pct < 7);
    } else if (rendementFilter === 'moyen') {
      filtered = filtered.filter(d => d.rendement_brut_pct >= 4 && d.rendement_brut_pct < 5);
    } else if (rendementFilter === 'faible') {
      filtered = filtered.filter(d => d.rendement_brut_pct < 4);
    }

    // Limiter à 30 départements pour la lisibilité
    return filtered.slice(0, 30).map(dept => ({
      departement: dept.departement,
      nom: getNomDepartement(dept.departement),
      rendement: dept.rendement_brut_pct,
      prix_m2: dept.prix_m2_median,
      loyer_m2: dept.loyer_m2_moyen,
      nb_ventes: dept.nb_ventes,
      color: getColorByRendement(dept.rendement_brut_pct),
    }));
  }, [rendementData, rendementFilter]);

  // Stats globales
  const stats = useMemo(() => {
    if (rendementData.length === 0) {
      return { total: 0, excellent: 0, bon: 0, moyen: 0, faible: 0, moyenne: 0, meilleur: null as DepartementRendement | null };
    }
    const excellent = rendementData.filter(d => d.rendement_brut_pct >= 7);
    const bon = rendementData.filter(d => d.rendement_brut_pct >= 5 && d.rendement_brut_pct < 7);
    const moyen = rendementData.filter(d => d.rendement_brut_pct >= 4 && d.rendement_brut_pct < 5);
    const faible = rendementData.filter(d => d.rendement_brut_pct < 4);
    const moyenne = rendementData.reduce((sum, d) => sum + d.rendement_brut_pct, 0) / rendementData.length;

    return {
      total: rendementData.length,
      excellent: excellent.length,
      bon: bon.length,
      moyen: moyen.length,
      faible: faible.length,
      moyenne: moyenne,
      meilleur: rendementData[0] || null,
    };
  }, [rendementData]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              <span className="text-white">Brick</span>
              <span className="text-[var(--primary-light)]">ByBrick</span>
            </Link>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)] text-sm">Rendement par Département</span>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-semibold">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <span className="text-white font-medium hidden sm:block">{user.first_name}</span>
                </div>
                <button onClick={logout} className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)] transition-colors">
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link href="/login" className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Connexion</Link>
                <Link href="/register" className="px-8 py-4 rounded-xl font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity">Créer un compte</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-sky-600/10 to-transparent" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px', textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Classement national des rendements
          </div>
          <div style={{ height: '20px' }}></div>
          <h1 className="text-5xl font-bold text-white mb-8">Rendement Brut par Département</h1>
          <div style={{ height: '20px' }}></div>
          <p className="text-xl text-[var(--text-secondary)] text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Comparez les rendements locatifs bruts de tous les départements français
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px 60px 48px' }}>

        {/* Stats Globales */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-sm text-[var(--text-muted)]">Départements</div>
          </div>
          <div className="bg-emerald-500/10 rounded-3xl border border-emerald-500/20 p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.excellent}</div>
            <div className="text-sm text-emerald-400/70">Excellent (≥7%)</div>
          </div>
          <div className="bg-blue-500/10 rounded-3xl border border-blue-500/20 p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">{stats.bon}</div>
            <div className="text-sm text-blue-400/70">Bon (5-7%)</div>
          </div>
          <div className="bg-amber-500/10 rounded-3xl border border-amber-500/20 p-6 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-1">{stats.moyen}</div>
            <div className="text-sm text-amber-400/70">Moyen (4-5%)</div>
          </div>
          <div className="bg-red-500/10 rounded-3xl border border-red-500/20 p-6 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">{stats.faible}</div>
            <div className="text-sm text-red-400/70">Faible (&lt;4%)</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{stats.moyenne.toFixed(1)}%</div>
            <div className="text-sm text-[var(--text-muted)]">Rendement moyen</div>
          </div>
        </div>

        <div style={{ height: '40px' }}></div>

        {/* Filtre Rendement */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] mb-8" style={{ padding: '32px' }}>
          <label className="text-lg font-medium text-white block mb-6">Filtrer par niveau de rendement</label>
          <div style={{ height: '20px' }}></div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setRendementFilter('all')}
              className={`rounded-3xl border p-6 text-center transition-all cursor-pointer ${
                rendementFilter === 'all'
                  ? 'bg-sky-500/10 border-sky-500/20'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-sky-500/50'
              }`}
            >
              <div className={`text-lg font-bold mb-1 ${rendementFilter === 'all' ? 'text-sky-400' : 'text-white'}`}>
                Tous
              </div>
            </button>
            <button
              onClick={() => setRendementFilter('excellent')}
              className={`rounded-3xl border p-6 text-center transition-all cursor-pointer ${
                rendementFilter === 'excellent'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <div className="text-lg font-bold text-emerald-400 mb-1">Excellent (≥7%)</div>
            </button>
            <button
              onClick={() => setRendementFilter('bon')}
              className={`rounded-3xl border p-6 text-center transition-all cursor-pointer ${
                rendementFilter === 'bon'
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'
              }`}
            >
              <div className="text-lg font-bold text-blue-400 mb-1">Bon (5-7%)</div>
            </button>
            <button
              onClick={() => setRendementFilter('moyen')}
              className={`rounded-3xl border p-6 text-center transition-all cursor-pointer ${
                rendementFilter === 'moyen'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <div className="text-lg font-bold text-amber-400 mb-1">Moyen (4-5%)</div>
            </button>
            <button
              onClick={() => setRendementFilter('faible')}
              className={`rounded-3xl border p-6 text-center transition-all cursor-pointer ${
                rendementFilter === 'faible'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              <div className="text-lg font-bold text-red-400 mb-1">Faible (&lt;4%)</div>
            </button>
          </div>
        </div>

        <div style={{ height: '30px' }}></div>

        {/* Graphique */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] mb-8" style={{ padding: '32px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Classement des Départements</h2>
              <p className="text-[var(--text-muted)]">
                Rendement brut annuel = (Loyer/m² × 12) / Prix/m² × 100
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              {Icons.chart}
            </div>
          </div>
          <div style={{ height: '20px' }}></div>

          {isLoading ? (
            <div className="rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div>Chargement des données...</div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
              <div style={{ height: '600px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      type="number"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 'dataMax + 1']}
                      label={{ value: 'Rendement Brut (%)', position: 'insideBottom', offset: -10, style: { fill: 'var(--text-secondary)', fontSize: '14px' } }}
                    />
                    <YAxis
                      type="category"
                      dataKey="departement"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      width={120}
                      tickFormatter={(value) => {
                        const nom = getNomDepartement(value);
                        return `${value} - ${nom.length > 15 ? nom.slice(0, 15) + '...' : nom}`;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        color: '#ffffff'
                      }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}
                      formatter={(value: any, name: string, props: any) => {
                        const entry = props.payload;
                        return [
                          <div key="tooltip" className="text-sm">
                            <div className="font-bold text-lg mb-2">{value.toFixed(2)}%</div>
                            <div className="text-gray-400">Prix/m² : {entry.prix_m2?.toFixed(0)} €</div>
                            <div className="text-gray-400">Loyer/m² : {entry.loyer_m2?.toFixed(2)} €</div>
                            <div className="text-gray-400">Nb ventes : {entry.nb_ventes?.toLocaleString()}</div>
                          </div>,
                          ''
                        ];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const dept = payload[0].payload.departement;
                          const nom = getNomDepartement(dept);
                          return `${dept} - ${nom}`;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="rendement" radius={[0, 8, 8, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '20px' }}></div>
              {/* Légende */}
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                  <span className="text-sm text-[var(--text-secondary)]">Excellent (≥7%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-sm text-[var(--text-secondary)]">Bon (5-7%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                  <span className="text-sm text-[var(--text-secondary)]">Moyen (4-5%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                  <span className="text-sm text-[var(--text-secondary)]">Faible (&lt;4%)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4">
                {Icons.chart}
              </div>
              <div className="text-lg mb-2">Aucune donnée disponible</div>
              <div className="text-sm">Aucun département ne correspond au filtre sélectionné</div>
            </div>
          )}
        </div>

        <div style={{ height: '30px' }}></div>

        {/* Top 10 Meilleurs */}
        {rendementFilter === 'all' && (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                {Icons.trophy}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Top 10 des Meilleurs Rendements</h2>
                <p className="text-sm text-[var(--text-muted)]">Les départements avec les meilleurs rendements bruts</p>
              </div>
            </div>
            <div style={{ height: '20px' }}></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {rendementData.slice(0, 10).map((dept, index) => (
                <div
                  key={dept.departement}
                  className="bg-[var(--bg-secondary)] rounded-2xl p-5 border border-[var(--border-color)] hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <div className="text-emerald-400">
                          {Icons.medal}
                        </div>
                      ) : null}
                      <span className="text-sm font-semibold text-[var(--text-muted)]">
                        {index < 3 ? '' : `#${index + 1}`}
                      </span>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getColorByRendement(dept.rendement_brut_pct) }}
                    />
                  </div>
                  <div className="font-bold text-xl text-white mb-1">{dept.departement}</div>
                  <div className="text-sm text-[var(--text-muted)] mb-3">{getNomDepartement(dept.departement)}</div>
                  <div className="text-3xl font-bold mb-1" style={{ color: getColorByRendement(dept.rendement_brut_pct) }}>
                    {dept.rendement_brut_pct.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{getRendementLabel(dept.rendement_brut_pct)}</div>
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Prix/m²</span>
                      <span className="text-white font-medium">{dept.prix_m2_median.toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[var(--text-muted)]">Loyer/m²</span>
                      <span className="text-white font-medium">{dept.loyer_m2_moyen.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: '30px' }}></div>

        {/* Explication */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              {Icons.coin}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Comment interpréter le rendement brut ?</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Formule de calcul</h3>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 font-mono text-sm text-[var(--text-secondary)]">
                Rendement Brut = (Loyer/m² × 12) / Prix/m² × 100
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-3">
                Le rendement brut représente le rapport entre les loyers annuels et le prix d'achat, sans tenir compte des charges et impôts.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Seuils recommandés</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-[var(--text-secondary)]"><strong>≥ 7%</strong> : Excellent - Investissement très rentable</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-[var(--text-secondary)]"><strong>5-7%</strong> : Bon - Rendement dans la moyenne haute</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-[var(--text-secondary)]"><strong>4-5%</strong> : Moyen - Rendement modéré</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-[var(--text-secondary)]"><strong>&lt; 4%</strong> : Faible - Privilégier la plus-value</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-300">
              <strong>Note :</strong> Le rendement brut ne prend pas en compte les charges (taxe foncière, charges de copropriété, travaux, vacance locative...).
              Le rendement net est généralement 20-30% inférieur. Utilisez le Widget 7 "Rendement Requis" pour une simulation plus précise.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
