'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';

const CONTAINER = { maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 48, paddingRight: 48 } as const;
const CTA_STYLE = { background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 40, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '14px 32px', fontSize: '1rem', lineHeight: 1 } as const;

// Types
interface CalculationResult {
  prixTotal: number;
  mensualite: number;
  annuite: number;
  loyerBrutRequis: number;
  loyerMensuelRequis: number;
  rendementRequis: number;
  coutTotal: number;
  coutCredit: number;
  status: 'excellent' | 'bon' | 'moyen' | 'eleve';
  statusLabel: string;
  statusEmoji: string;
  message: string;
}

interface DureeComparison {
  duree: number;
  mensualite: number;
  loyerRequis: number;
  rendement: number;
  coutTotal: number;
  status: 'excellent' | 'bon' | 'moyen' | 'eleve';
  statusLabel: string;
}

// Icons
const Icons = {
  coin: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chart: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  calculator: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  percent: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
  time: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  lightbulb: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  alert: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
};

// Fonction de calcul de mensualité de crédit
function calculerMensualite(capital: number, tauxAnnuel: number, dureeAns: number): number {
  if (capital <= 0 || dureeAns <= 0) return 0;
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const nbMensualites = dureeAns * 12;
  if (tauxMensuel <= 0) return capital / nbMensualites;
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1);
}

// Fonction pour formatter les euros
function formatEuro(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function RendementRequisPage() {
  const { isAuthenticated, user } = useAuth();

  // États des paramètres
  const [apport, setApport] = useState(10000);
  const [emprunt, setEmprunt] = useState(90000);
  const [tauxInteret, setTauxInteret] = useState(3.25);
  const [dureeCredit, setDureeCredit] = useState(20);
  const [inclureCharges, setInclureCharges] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load preferences from Widget 1 on mount
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    } else if (!isAuthenticated) {
      setPrefsLoaded(true);
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const prefs = await response.json();
        
        if (prefs) {
          // Priorité 1 : Charger les valeurs sauvegardées du widget 7 (rendement requis)
          if (prefs.rendement_requis_emprunt !== undefined) {
            setEmprunt(prefs.rendement_requis_emprunt);
          }
          if (prefs.rendement_requis_apport !== undefined) {
            setApport(prefs.rendement_requis_apport);
          }
          if (prefs.rendement_requis_taux_interet !== undefined) {
            setTauxInteret(prefs.rendement_requis_taux_interet);
          }
          if (prefs.rendement_requis_duree_credit !== undefined) {
            setDureeCredit(prefs.rendement_requis_duree_credit);
          }
          if (prefs.rendement_requis_inclure_charges !== undefined) {
            setInclureCharges(prefs.rendement_requis_inclure_charges);
          }
          
          // Priorité 2 : Si pas de valeurs sauvegardées du widget 7, utiliser celles du widget 1
          if (prefs.rendement_requis_emprunt === undefined && prefs.prix_projet && prefs.apport) {
            // Montant emprunté = prix projet - apport (le prix_projet est le prix total du bien)
            const montantEmprunte = Math.max(0, prefs.prix_projet - prefs.apport);
            setEmprunt(montantEmprunte);
            // Apport = apport du widget 1
            setApport(prefs.apport);
            // Durée crédit peut aussi être récupérée si disponible
            if (prefs.duree_credit) {
              setDureeCredit(prefs.duree_credit);
            }
          }
        }
        setPrefsLoaded(true);
      } else {
        setPrefsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPrefsLoaded(true);
    }
  };


  // Calcul principal
  const result = useMemo((): CalculationResult => {
    const prixTotal = apport + emprunt;
    const mensualite = calculerMensualite(emprunt, tauxInteret, dureeCredit);
    const annuite = mensualite * 12;

    // Coefficient pour les charges (20% si inclus)
    const coefNet = inclureCharges ? 0.8 : 1.0;

    // Loyer annuel brut nécessaire pour couvrir les mensualités
    const loyerAnnuelBrut = annuite / coefNet;
    const loyerMensuelBrut = loyerAnnuelBrut / 12;

    // Rendement brut requis
    const rendementRequis = prixTotal > 0 ? (loyerAnnuelBrut / prixTotal) * 100 : 0;

    // Coût total du crédit
    const coutTotal = mensualite * dureeCredit * 12;
    const coutCredit = coutTotal - emprunt;

    // Déterminer le statut selon le rendement
    let status: 'excellent' | 'bon' | 'moyen' | 'eleve';
    let statusLabel: string;
    let statusEmoji: string;
    let message: string;

    if (rendementRequis <= 4.5) {
      status = 'excellent';
      statusLabel = 'Excellent';
      statusEmoji = '🟢';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre projet présente un excellent rendement pour un investissement locatif. Les loyers couvrent largement le crédit, même après charges.`;
    } else if (rendementRequis <= 7.0) {
      status = 'bon';
      statusLabel = 'Bon';
      statusEmoji = '🔵';
      message = `Un rendement de ${rendementRequis.toFixed(2)}% est dans la moyenne du marché locatif français. Le projet est viable si la zone présente une bonne tension locative.`;
    } else if (rendementRequis <= 9.0) {
      status = 'moyen';
      statusLabel = 'Moyen';
      statusEmoji = '🟡';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre marge est serrée. Assurez-vous que le bien se loue facilement et au prix calculé. Privilégiez les zones très tendues.`;
    } else {
      status = 'eleve';
      statusLabel = 'Élevé';
      statusEmoji = '🔴';
      message = `À ${rendementRequis.toFixed(2)}%, il sera difficile de trouver un locataire acceptant ce loyer. Envisagez d'augmenter votre apport, d'allonger la durée ou de chercher un bien moins cher.`;
    }

    return {
      prixTotal,
      mensualite,
      annuite,
      loyerBrutRequis: loyerAnnuelBrut,
      loyerMensuelRequis: loyerMensuelBrut,
      rendementRequis,
      coutTotal,
      coutCredit,
      status,
      statusLabel,
      statusEmoji,
      message,
    };
  }, [apport, emprunt, tauxInteret, dureeCredit, inclureCharges]);

  // Comparaison avec différentes durées
  const dureeComparisons = useMemo((): DureeComparison[] => {
    const durees = [10, 15, 20, 25, 30];
    const coefNet = inclureCharges ? 0.8 : 1.0;
    const prixTotal = apport + emprunt;

    return durees.map(duree => {
      const mensualite = calculerMensualite(emprunt, tauxInteret, duree);
      const annuite = mensualite * 12;
      const loyerRequis = (annuite / coefNet) / 12;
      const rendement = prixTotal > 0 ? ((annuite / coefNet) / prixTotal) * 100 : 0;
      const coutTotal = mensualite * duree * 12;

      let status: 'excellent' | 'bon' | 'moyen' | 'eleve';
      let statusLabel: string;

      if (rendement <= 4.5) {
        status = 'excellent';
        statusLabel = 'Excellent';
      } else if (rendement <= 7.0) {
        status = 'bon';
        statusLabel = 'Bon';
      } else if (rendement <= 9.0) {
        status = 'moyen';
        statusLabel = 'Moyen';
      } else {
        status = 'eleve';
        statusLabel = 'Élevé';
      }

      return { duree, mensualite, loyerRequis, rendement, coutTotal, status, statusLabel };
    });
  }, [apport, emprunt, tauxInteret, inclureCharges]);

  // Couleurs selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return { bg: 'bg-emerald-500', text: 'text-emerald-400', gradient: 'from-emerald-500 to-green-400' };
      case 'bon': return { bg: 'bg-blue-500', text: 'text-blue-400', gradient: 'from-blue-500 to-cyan-400' };
      case 'moyen': return { bg: 'bg-amber-500', text: 'text-amber-400', gradient: 'from-amber-500 to-yellow-400' };
      case 'eleve': return { bg: 'bg-rose-500', text: 'text-rose-400', gradient: 'from-rose-500 to-red-400' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-400', gradient: 'from-gray-500 to-gray-400' };
    }
  };

  const colors = getStatusColor(result.status);

  // Calcul de la barre de progression (0-12% max)
  const barMax = 12;
  const barValue = Math.max(0, Math.min(barMax, result.rendementRequis));
  const barPercent = (barValue / barMax) * 100;

  // Calculs pour les conseils
  const ratioApport = result.prixTotal > 0 ? (apport / result.prixTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-600/10 to-transparent" style={{ paddingTop: 72 }}>
        <div style={{ ...CONTAINER, paddingTop: 64, paddingBottom: 56, textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Outil • Rendement requis
          </div>
          <div aria-hidden style={{ height: 22 }} />
          <h1 className="text-5xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Rendement Requis</h1>
          <div aria-hidden style={{ height: 14 }} />
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
            Calculez le rendement brut minimal pour que les loyers couvrent votre crédit. Les paramètres de base se règlent dans les réglages.
          </p>
          <div aria-hidden style={{ height: 30 }} />
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={CTA_STYLE}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ ...CONTAINER, paddingTop: 0, paddingBottom: 96 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 place-items-center xl:place-items-start" style={{ gap: '64px' }}>

          {/* LEFT COLUMN - Paramètres */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '600px' }}>

            {/* Card: Paramètres du Crédit */}
            <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '32px' }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center text-indigo-400">
                  {Icons.calculator}
                </div>
                <h2 className="text-2xl font-semibold text-white">Paramètres du Crédit</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* Apport */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Apport personnel</label>
                    <span className="text-2xl font-bold text-white">{formatEuro(apport)}</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={100000} step={1000} />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)]">
                    <span>0 €</span>
                    <span>100 000 €</span>
                  </div>
                </div>

                {/* Emprunt */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <label className="text-lg text-[var(--text-secondary)]">Montant emprunté</label>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Montant du crédit uniquement (apport non inclus)</p>
                    </div>
                    <span className="text-2xl font-bold text-white">{formatEuro(emprunt)}</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[emprunt]} onValueChange={(v) => setEmprunt(v[0])} min={10000} max={400000} step={5000} />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)]">
                    <span>10 000 €</span>
                    <span>400 000 €</span>
                  </div>
                </div>

                {/* Taux d'intérêt */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Taux d'intérêt annuel</label>
                    <span className="text-2xl font-bold text-white">{tauxInteret.toFixed(2)}%</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[tauxInteret * 100]} onValueChange={(v) => setTauxInteret(v[0] / 100)} min={10} max={800} step={5} />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)]">
                    <span>0,1%</span>
                    <span>8%</span>
                  </div>
                </div>

                {/* Durée */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Durée du crédit</label>
                    <span className="text-2xl font-bold text-white">{dureeCredit} ans</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={5} max={30} step={1} />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)]">
                    <span>5 ans</span>
                    <span>30 ans</span>
                  </div>
                </div>

                {/* Inclure les charges */}
                <div className="bg-[var(--bg-secondary)] rounded-2xl" style={{ padding: '24px' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg text-[var(--text-secondary)]">Inclure 20% de charges locatives</span>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Taxe foncière, charges, vacance, gestion...</p>
                    </div>
                    <div className="flex" style={{ gap: '12px' }}>
                      <button
                        onClick={() => setInclureCharges(false)}
                        style={{ padding: '12px 24px' }}
                        className={`rounded-xl text-sm font-medium transition-all ${!inclureCharges ? 'bg-[var(--bg-card)] text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
                      >
                        Non
                      </button>
                      <button
                        onClick={() => setInclureCharges(true)}
                        style={{ padding: '12px 24px' }}
                        className={`rounded-xl text-sm font-medium transition-all ${inclureCharges ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-[var(--text-muted)]'}`}
                      >
                        Oui
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Card: Comparaison des durées */}
            <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '32px' }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center text-cyan-400">
                  {Icons.time}
                </div>
                <h2 className="text-2xl font-semibold text-white">Comparaison par Durée</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-2 text-[var(--text-muted)] font-medium">Durée</th>
                      <th className="text-right py-3 px-2 text-[var(--text-muted)] font-medium">Mensualité</th>
                      <th className="text-right py-3 px-2 text-[var(--text-muted)] font-medium">Loyer requis</th>
                      <th className="text-right py-3 px-2 text-[var(--text-muted)] font-medium">Rendement</th>
                      <th className="text-center py-3 px-2 text-[var(--text-muted)] font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dureeComparisons.map((comp) => {
                      const isSelected = comp.duree === dureeCredit;
                      const statusColors = getStatusColor(comp.status);
                      return (
                        <tr
                          key={comp.duree}
                          className={`border-b border-[var(--border-color)] transition-colors ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-[var(--bg-secondary)]'}`}
                        >
                          <td className="py-4 px-2">
                            <span className={`font-semibold ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                              {comp.duree} ans
                            </span>
                          </td>
                          <td className="text-right py-4 px-2 text-[var(--text-secondary)]">
                            {formatEuro(comp.mensualite)}
                          </td>
                          <td className={`text-right py-4 px-2 font-semibold ${statusColors.text}`}>
                            {formatEuro(comp.loyerRequis)}
                          </td>
                          <td className="text-right py-4 px-2 font-bold text-white">
                            {comp.rendement.toFixed(2)}%
                          </td>
                          <td className="text-center py-4 px-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              comp.status === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                              comp.status === 'bon' ? 'bg-blue-500/20 text-blue-400' :
                              comp.status === 'moyen' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {comp.statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - Résultats */}
          <div className="xl:sticky xl:top-32 xl:self-start" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '550px' }}>

            {/* Card: Rendement Requis */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] text-center" style={{ padding: '48px' }}>
              <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {result.statusEmoji} Rendement Brut Minimal Requis
              </div>
              <div style={{ height: '10px' }}></div>
              <div className={`text-7xl font-extrabold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent my-6`}>
                {result.rendementRequis.toFixed(2)}
                <span className="text-3xl">%</span>
              </div>
              <div style={{ height: '2  0px' }}></div>
              {/* Barre de progression */}
              <div className="bg-[var(--bg-secondary)] rounded-full h-6 overflow-hidden mb-6">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.bg} flex items-center justify-end pr-3`}
                  style={{ width: `${barPercent}%` }}
                >
                  <span className="text-xs font-bold text-white">{result.rendementRequis.toFixed(2)}%</span>
                </div>
              </div>

              <div className="text-[var(--text-muted)] mb-4">
                Calcul {inclureCharges ? 'avec 20% de charges' : 'hors charges'}
              </div>
              <div style={{ height: '10px' }}></div>
              <div
                className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                  result.status === 'excellent' ? 'bg-emerald-500/15 text-emerald-400' :
                  result.status === 'bon' ? 'bg-blue-500/15 text-blue-400' :
                  result.status === 'moyen' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-rose-500/15 text-rose-400'
                }`}
              >
                {result.statusLabel}
              </div>
            </div>

            {/* Card: Détails Financiers */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '28px' }}>
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  {Icons.coin}
                </div>
                <span className="text-xl font-medium text-white">Détails Financiers</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Prix d'achat total</span>
                  <span className="text-xl font-bold text-white">{formatEuro(result.prixTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Mensualité crédit</span>
                  <span className="text-xl font-bold text-white">{formatEuro(result.mensualite)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Annuité</span>
                  <span className="text-lg font-semibold text-[var(--text-secondary)]">{formatEuro(result.annuite)}</span>
                </div>
                <div className="h-px bg-[var(--border-color)]" />
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Loyer brut requis</span>
                  <span className={`text-2xl font-bold ${colors.text}`}>{formatEuro(result.loyerMensuelRequis)}/mois</span>
                </div>
                <div className="h-px bg-[var(--border-color)]" />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Montant total remboursé</span>
                    <span className="text-lg text-[var(--text-secondary)]">{formatEuro(result.coutTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                    <span>Dont capital : {formatEuro(emprunt)}</span>
                    <span>Dont intérêts : {formatEuro(result.coutCredit)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Coût des intérêts</span>
                  <span className="text-lg text-amber-400">{formatEuro(result.coutCredit)}</span>
                </div>
              </div>
            </div>

            {/* Card: Conseils */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  {Icons.lightbulb}
                </div>
                <span className="text-xl font-medium text-white">Analyse & Recommandations</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Conseil sur l'apport */}
                {ratioApport < 10 && (
                  <div className="flex items-start gap-3 text-amber-400">
                    {Icons.alert}
                    <p className="text-sm">
                      <strong>Apport faible ({ratioApport.toFixed(0)}%)</strong> : Augmenter votre apport de 5-10% réduirait significativement votre mensualité et le rendement requis.
                    </p>
                  </div>
                )}
                {ratioApport >= 30 && (
                  <div className="flex items-start gap-3 text-emerald-400">
                    {Icons.check}
                    <p className="text-sm">
                      <strong>Apport confortable ({ratioApport.toFixed(0)}%)</strong> : Votre apport important vous donne une bonne marge de manœuvre et réduit le risque financier.
                    </p>
                  </div>
                )}

                {/* Conseil sur le taux */}
                {tauxInteret > 4.5 && (
                  <div className="flex items-start gap-3 text-amber-400">
                    {Icons.alert}
                    <p className="text-sm">
                      <strong>Taux élevé ({tauxInteret.toFixed(2)}%)</strong> : Comparez les offres bancaires. Une réduction de 0,5% du taux pourrait économiser plusieurs milliers d'euros.
                    </p>
                  </div>
                )}

                {/* Conseil sur la durée */}
                {dureeCredit <= 15 && (
                  <div className="flex items-start gap-3 text-blue-400">
                    {Icons.lightbulb}
                    <p className="text-sm">
                      <strong>Durée courte ({dureeCredit} ans)</strong> : Vous économisez sur les intérêts ({formatEuro(result.coutCredit)}) mais la mensualité est élevée. Vérifiez que le loyer de marché permet de couvrir {formatEuro(result.loyerMensuelRequis)}/mois.
                    </p>
                  </div>
                )}
                {dureeCredit >= 25 && (
                  <div className="flex items-start gap-3 text-blue-400">
                    {Icons.lightbulb}
                    <p className="text-sm">
                      <strong>Durée longue ({dureeCredit} ans)</strong> : Mensualité réduite mais coût total plus élevé ({formatEuro(result.coutCredit)} d'intérêts). Bon compromis si vous débutez.
                    </p>
                  </div>
                )}

                {/* Conseil selon le rendement */}
                {result.rendementRequis > 8 && (
                  <div className="flex items-start gap-3 text-rose-400">
                    {Icons.alert}
                    <p className="text-sm">
                      <strong>Optimisation nécessaire</strong> : Pour réduire le rendement requis à un niveau acceptable (≤ 7%), vous pouvez : augmenter l'apport, allonger la durée, ou négocier un meilleur taux.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Message Final */}
            <div className={`rounded-3xl border-l-4 ${
              result.status === 'excellent' ? 'bg-emerald-500/10 border-emerald-500' :
              result.status === 'bon' ? 'bg-blue-500/10 border-blue-500' :
              result.status === 'moyen' ? 'bg-amber-500/10 border-amber-500' :
              'bg-rose-500/10 border-rose-500'
            }`} style={{ padding: '24px' }}>
              <p className={`text-sm leading-relaxed ${
                result.status === 'excellent' ? 'text-emerald-300' :
                result.status === 'bon' ? 'text-blue-300' :
                result.status === 'moyen' ? 'text-amber-300' :
                'text-rose-300'
              }`}>
                {result.status === 'excellent' && '✅ '}
                {result.status === 'bon' && '💡 '}
                {result.status === 'moyen' && '⚠️ '}
                {result.status === 'eleve' && '❌ '}
                <strong className="mr-1">
                  {result.status === 'excellent' && 'Rendement très attractif :'}
                  {result.status === 'bon' && 'Rendement correct :'}
                  {result.status === 'moyen' && 'Rendement limité :'}
                  {result.status === 'eleve' && 'Rendement requis trop élevé :'}
                </strong>
                {result.message}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* SAVE SECTION - Standalone at bottom */}
      {/* Footer CTA */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', paddingTop: 64, paddingBottom: 96, background: 'linear-gradient(to top, rgba(99,102,241,0.06), transparent)' }}>
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
