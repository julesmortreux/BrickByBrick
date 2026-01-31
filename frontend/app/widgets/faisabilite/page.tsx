'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';

interface CalculationResult {
  capaciteEmprunt: number;
  mensualiteMax: number;
  budgetTotal: number;
  tauxEndettement: number;
  score: number;
  verdict: string;
  verdictColor: string;
  facteurs: { nom: string; score: number; maxScore: number; impact: string }[];
  conseils: string[];
  blocages: string[];
}

const BANK_CRITERIA = { tauxEndettementMax: 0.35, tauxInteret: 0.035, assurancePct: 0.0034 };

const Icons = {
  back: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  home: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  user: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  wallet: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  shield: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  chart: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  x: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  alert: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  lightbulb: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
};

export default function FaisabilitePage() {
  const { isAuthenticated, user, logout } = useAuth();
  
  const [prixProjet, setPrixProjet] = useState(150000);
  const [apport, setApport] = useState(15000);
  const [dureeCredit, setDureeCredit] = useState(20);
  const [statut, setStatut] = useState<'etudiant' | 'alternant' | 'cdi' | 'cdd' | 'fonctionnaire'>('etudiant');
  const [anciennete, setAnciennete] = useState(0);
  const [revenuMensuel, setRevenuMensuel] = useState(800);
  const [coBorrower, setCoBorrower] = useState(false);
  const [revenuCoBorrower, setRevenuCoBorrower] = useState(0);
  const [garant, setGarant] = useState<'aucun' | 'oui'>('oui');
  const [revenuGarant, setRevenuGarant] = useState(4000);
  const [garantProprio, setGarantProprio] = useState(true);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const prefs = await response.json();
        
        // If prefs is null, user hasn't saved Widget 1 yet - keep default values
        if (prefs !== null) {
          setPrixProjet(prefs.prix_projet);
          setApport(prefs.apport);
          setDureeCredit(prefs.duree_credit);
          setStatut(prefs.statut);
          setAnciennete(prefs.anciennete);
          setRevenuMensuel(prefs.revenu_mensuel);
          setCoBorrower(prefs.co_borrower);
          setRevenuCoBorrower(prefs.revenu_co_borrower);
          setGarant(prefs.garant);
          setRevenuGarant(prefs.revenu_garant);
          setGarantProprio(prefs.garant_proprio);
        }
        // Mark as loaded even if null (user just hasn't saved yet)
        setPrefsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPrefsLoaded(true); // Mark as loaded to prevent infinite retries
    }
  };

  const savePreferences = async () => {
    if (!isAuthenticated) {
      setSaveMessage({ type: 'error', text: 'Connectez-vous pour sauvegarder' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // First, fetch existing preferences to preserve other widgets' settings
      const getResponse = await authFetch('/auth/preferences');
      let existingPrefs = {};
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data) existingPrefs = data;
      }

      // Merge with Widget 1 fields (preserves Widget 2, 3 settings)
      const response = await authFetch('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          ...existingPrefs,
          prix_projet: prixProjet,
          apport: apport,
          duree_credit: dureeCredit,
          statut: statut,
          anciennete: anciennete,
          revenu_mensuel: revenuMensuel,
          co_borrower: coBorrower,
          revenu_co_borrower: revenuCoBorrower,
          garant: garant,
          revenu_garant: revenuGarant,
          garant_proprio: garantProprio
        })
      });

      if (response.ok) {
        // Redirect to home page after successful save
        window.location.href = '/';
      } else {
        setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
        setIsSaving(false);
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur de connexion' });
      setIsSaving(false);
    }
  };

  const result = useMemo((): CalculationResult => {
    const facteurs: CalculationResult['facteurs'] = [];
    const conseils: string[] = [];
    const blocages: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    maxPossibleScore += 30;
    let statutScore = 0;
    let statutImpact = 'neutre';
    if (statut === 'fonctionnaire') { statutScore = 30; statutImpact = 'positif'; }
    else if (statut === 'cdi') { 
      if (anciennete >= 12) { statutScore = 28; statutImpact = 'positif'; }
      else { statutScore = 18; conseils.push("1 an d'ancienneté améliorerait votre dossier"); }
    }
    else if (statut === 'cdd') { statutScore = 8; statutImpact = 'negatif'; blocages.push("CDD : garantie solide requise"); }
    else if (statut === 'alternant') { statutScore = 12; statutImpact = 'negatif'; }
    else { statutScore = 3; statutImpact = 'bloquant'; blocages.push("Étudiant : garant obligatoire"); }
    totalScore += statutScore;
    facteurs.push({ nom: 'Situation', score: statutScore, maxScore: 30, impact: statutImpact });

    maxPossibleScore += 25;
    let revenuStable = 0;
    if (statut === 'cdi' || statut === 'fonctionnaire') revenuStable = revenuMensuel;
    else if (statut === 'alternant') revenuStable = revenuMensuel * 0.7;
    else if (statut === 'cdd') revenuStable = revenuMensuel * 0.5;
    if (coBorrower) revenuStable += revenuCoBorrower;
    
    // Score revenus basé sur la cohérence avec le projet (pas de seuils absolus)
    // On calcule si les revenus permettent de financer le projet avec un taux d'endettement < 35%
    const tauxMensuelCalc = (BANK_CRITERIA.tauxInteret + BANK_CRITERIA.assurancePct) / 12;
    const nbMensualitesCalc = dureeCredit * 12;
    const montantEmprunteCalc = Math.max(0, prixProjet - apport);
    const mensualiteRequise = montantEmprunteCalc > 0 ? montantEmprunteCalc * (tauxMensuelCalc * Math.pow(1 + tauxMensuelCalc, nbMensualitesCalc)) / (Math.pow(1 + tauxMensuelCalc, nbMensualitesCalc) - 1) : 0;
    const revenuNecessaire = mensualiteRequise / 0.35; // Revenu pour être à 35% d'endettement
    
    let revenuScore = 0;
    let revenuImpact = 'neutre';
    const revenuEffectif = revenuStable > 0 ? revenuStable : (garant !== 'aucun' ? revenuGarant * 0.3 : 0);
    
    if (revenuEffectif <= 0) {
      revenuScore = 0;
      revenuImpact = 'bloquant';
    } else {
      const ratioRevenu = revenuEffectif / revenuNecessaire;
      if (ratioRevenu >= 1.5) { revenuScore = 25; revenuImpact = 'positif'; } // Très confortable
      else if (ratioRevenu >= 1.2) { revenuScore = 22; revenuImpact = 'positif'; } // Confortable
      else if (ratioRevenu >= 1.0) { revenuScore = 18; } // Suffisant
      else if (ratioRevenu >= 0.85) { revenuScore = 12; revenuImpact = 'negatif'; conseils.push("Revenus un peu justes pour ce projet"); }
      else if (ratioRevenu >= 0.7) { revenuScore = 6; revenuImpact = 'negatif'; }
      else { revenuScore = 0; revenuImpact = 'bloquant'; }
    }
    totalScore += revenuScore;
    facteurs.push({ nom: 'Revenus', score: revenuScore, maxScore: 25, impact: revenuImpact });

    maxPossibleScore += 20;
    const apportPct = prixProjet > 0 ? (apport / prixProjet) * 100 : 0;
    let apportScore = 0;
    let apportImpact = 'neutre';
    if (apportPct >= 30) { apportScore = 20; apportImpact = 'positif'; }
    else if (apportPct >= 20) { apportScore = 17; apportImpact = 'positif'; }
    else if (apportPct >= 15) { apportScore = 14; }
    else if (apportPct >= 10) { apportScore = 10; }
    else if (apportPct >= 5) { apportScore = 5; apportImpact = 'negatif'; conseils.push("Visez 10% d'apport minimum"); }
    else { apportScore = 0; apportImpact = 'bloquant'; blocages.push("Apport insuffisant"); }
    totalScore += apportScore;
    facteurs.push({ nom: 'Apport', score: apportScore, maxScore: 20, impact: apportImpact });

    maxPossibleScore += 20;
    let garantScore = 0;
    let garantImpact = 'neutre';
    if (garant === 'aucun') {
      garantImpact = (statut === 'etudiant' || statut === 'cdd') ? 'bloquant' : 'negatif';
      if (statut === 'etudiant') blocages.push("Garant obligatoire pour un étudiant");
    } else {
      if (revenuGarant >= 5000 && garantProprio) { garantScore = 20; garantImpact = 'positif'; }
      else if (revenuGarant >= 4000) { garantScore = 16; garantImpact = 'positif'; }
      else if (revenuGarant >= 3000) { garantScore = 12; }
      else { garantScore = 6; garantImpact = 'negatif'; }
    }
    totalScore += garantScore;
    facteurs.push({ nom: 'Garantie', score: garantScore, maxScore: 20, impact: garantImpact });

    maxPossibleScore += 5;
    const revenuTotal = revenuStable > 0 ? revenuStable : (garant !== 'aucun' ? revenuGarant * 0.3 : 0);
    const capaciteRemboursement = revenuTotal * BANK_CRITERIA.tauxEndettementMax;
    const tauxMensuel = (BANK_CRITERIA.tauxInteret + BANK_CRITERIA.assurancePct) / 12;
    const nbMensualites = dureeCredit * 12;
    const capaciteEmprunt = capaciteRemboursement > 0 ? capaciteRemboursement * ((1 - Math.pow(1 + tauxMensuel, -nbMensualites)) / tauxMensuel) : 0;
    const montantEmprunte = Math.max(0, prixProjet - apport);
    const mensualiteProjet = montantEmprunte > 0 ? montantEmprunte * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1) : 0;
    const tauxEndettement = revenuTotal > 0 ? (mensualiteProjet / revenuTotal) * 100 : 100;
    
    let ratioScore = 0;
    let ratioImpact = 'neutre';
    if (tauxEndettement <= 30) { ratioScore = 5; ratioImpact = 'positif'; }
    else if (tauxEndettement <= 35) { ratioScore = 3; }
    else { ratioScore = 0; ratioImpact = 'bloquant'; blocages.push(`Endettement: ${tauxEndettement.toFixed(0)}%`); }
    totalScore += ratioScore;
    facteurs.push({ nom: 'Taux dette', score: ratioScore, maxScore: 5, impact: ratioImpact });

    const finalScore = Math.round((totalScore / maxPossibleScore) * 100);
    const hasBlocker = blocages.length > 0;
    
    let verdict = '', verdictColor = '';
    if (hasBlocker) { verdict = 'Non Finançable'; verdictColor = 'rose'; }
    else if (finalScore >= 75) { verdict = 'Excellente'; verdictColor = 'emerald'; }
    else if (finalScore >= 55) { verdict = 'Correcte'; verdictColor = 'amber'; }
    else { verdict = 'Difficile'; verdictColor = 'orange'; }

    if (!conseils.length && !hasBlocker) conseils.push("Bon profil, consultez plusieurs banques");

    return { capaciteEmprunt: Math.round(capaciteEmprunt), mensualiteMax: Math.round(capaciteRemboursement), budgetTotal: Math.round(capaciteEmprunt + apport), tauxEndettement, score: finalScore, verdict, verdictColor, facteurs, conseils, blocages };
  }, [statut, anciennete, revenuMensuel, coBorrower, revenuCoBorrower, apport, dureeCredit, prixProjet, garant, revenuGarant, garantProprio]);

  const getScoreColor = () => {
    if (result.blocages.length > 0) return 'from-rose-500 to-red-400';
    if (result.score >= 75) return 'from-emerald-500 to-green-400';
    if (result.score >= 55) return 'from-amber-500 to-yellow-400';
    return 'from-orange-500 to-rose-400';
  };

  const getBarColor = (impact: string) => {
    if (impact === 'positif') return 'bg-emerald-500';
    if (impact === 'negatif') return 'bg-orange-500';
    if (impact === 'bloquant') return 'bg-rose-500';
    return 'bg-blue-500';
  };

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
            <span className="text-[var(--text-secondary)] text-sm">Faisabilité</span>
          </div>
          
          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-semibold">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <span className="text-white font-medium hidden sm:block">
                    {user.first_name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero - with padding-top for fixed navbar */}
      <div className="bg-gradient-to-b from-violet-600/10 to-transparent" style={{ paddingTop: '80px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Simulateur de prêt immobilier
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Puis-je emprunter ?</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', textAlign: 'center', margin: '0 auto' }}>
            Découvrez votre capacité d'emprunt selon les critères réels des banques.
          </p>
        </div>
      </div>

      {/* MAIN - AIRY UI */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px 128px 48px' }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 place-items-center xl:place-items-start" style={{ gap: '64px' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', width: '100%', maxWidth: '600px' }}>
            
            {/* CARD 1: PROJET */}
            <section 
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]"
              style={{ padding: '48px' }}
            >
              <div className="flex items-center" style={{ gap: '20px', marginBottom: '40px' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center text-cyan-400">
                  {Icons.home}
                </div>
                <h2 className="text-2xl font-semibold text-white">Votre projet</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {/* Prix */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Prix du bien</label>
                    <span className="text-3xl font-bold text-white">{prixProjet.toLocaleString()} €</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[prixProjet]} onValueChange={(v) => setPrixProjet(v[0])} min={50000} max={500000} step={5000} />
                  </div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)]">
                    <span>50 000 €</span>
                    <span>500 000 €</span>
                  </div>
                </div>

                {/* Apport */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Votre apport</label>
                    <div>
                      <span className="text-3xl font-bold text-white">{apport.toLocaleString()} €</span>
                      <span className="text-base text-[var(--text-muted)] ml-3">({((apport / prixProjet) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={150000} step={1000} />
                  </div>
                </div>

                {/* Durée */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Durée du crédit</label>
                    <span className="text-3xl font-bold text-white">{dureeCredit} ans</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={10} max={25} step={1} />
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 2: SITUATION */}
            <section 
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]"
              style={{ padding: '48px' }}
            >
              <div className="flex items-center" style={{ gap: '20px', marginBottom: '40px' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                  {Icons.user}
                </div>
                <h2 className="text-2xl font-semibold text-white">Votre situation</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="grid grid-cols-5" style={{ gap: '12px' }}>
                  {[
                    { id: 'etudiant', label: 'Étudiant' },
                    { id: 'alternant', label: 'Alternant' },
                    { id: 'cdd', label: 'CDD' },
                    { id: 'cdi', label: 'CDI' },
                    { id: 'fonctionnaire', label: 'Fonction.' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatut(s.id as typeof statut)}
                      style={{ padding: '20px 8px' }}
                      className={`rounded-2xl text-sm font-medium transition-all ${
                        statut === s.id 
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {statut === 'cdi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
                    <div className="flex justify-between items-baseline">
                      <label className="text-lg text-[var(--text-secondary)]">Ancienneté</label>
                      <span className="text-2xl font-semibold text-white">
                        {anciennete >= 12 ? `${Math.floor(anciennete / 12)} an${Math.floor(anciennete / 12) > 1 ? 's' : ''}` : `${anciennete} mois`}
                      </span>
                    </div>
                    <div style={{ padding: '0 8px' }}>
                      <Slider value={[anciennete]} onValueChange={(v) => setAnciennete(v[0])} min={0} max={60} step={6} />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARD 3: REVENUS */}
            <section 
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]"
              style={{ padding: '48px' }}
            >
              <div className="flex items-center" style={{ gap: '20px', marginBottom: '40px' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400">
                  {Icons.wallet}
                </div>
                <h2 className="text-2xl font-semibold text-white">Vos revenus</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="flex justify-between items-baseline">
                    <label className="text-lg text-[var(--text-secondary)]">Revenu mensuel net</label>
                    <span className="text-3xl font-bold text-white">{revenuMensuel.toLocaleString()} €</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[revenuMensuel]} onValueChange={(v) => setRevenuMensuel(v[0])} min={0} max={6000} step={100} />
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] rounded-2xl" style={{ padding: '32px' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-[var(--text-secondary)]">Achat à deux ?</span>
                    <div className="flex" style={{ gap: '16px' }}>
                      <button 
                        onClick={() => setCoBorrower(false)} 
                        style={{ padding: '14px 32px' }}
                        className={`rounded-xl text-sm font-medium transition-all ${!coBorrower ? 'bg-[var(--bg-card)] text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
                      >
                        Non
                      </button>
                      <button 
                        onClick={() => setCoBorrower(true)} 
                        style={{ padding: '14px 32px' }}
                        className={`rounded-xl text-sm font-medium transition-all ${coBorrower ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-[var(--text-muted)]'}`}
                      >
                        Oui
                      </button>
                    </div>
                  </div>
                  
                  {coBorrower && (
                    <div className="border-t border-[var(--border-color)]" style={{ marginTop: '24px', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="flex justify-between items-baseline">
                        <label className="text-[var(--text-muted)]">Revenus co-emprunteur</label>
                        <span className="text-xl font-semibold text-white">{revenuCoBorrower.toLocaleString()} €</span>
                      </div>
                      <div style={{ padding: '0 8px' }}>
                        <Slider value={[revenuCoBorrower]} onValueChange={(v) => setRevenuCoBorrower(v[0])} min={0} max={5000} step={100} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* CARD 4: GARANTIE */}
            <section 
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]"
              style={{ padding: '48px' }}
            >
              <div className="flex items-center" style={{ gap: '20px', marginBottom: '40px' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center text-rose-400">
                  {Icons.shield}
                </div>
                <h2 className="text-2xl font-semibold text-white">Garantie</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="grid grid-cols-2" style={{ gap: '20px' }}>
                  <button
                    onClick={() => setGarant('aucun')}
                    style={{ padding: '24px' }}
                    className={`rounded-2xl text-base font-medium transition-all flex items-center justify-center gap-3 ${
                      garant === 'aucun' 
                        ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/30' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {Icons.x}
                    <span>Aucun garant</span>
                  </button>
                  <button
                    onClick={() => setGarant('oui')}
                    style={{ padding: '24px' }}
                    className={`rounded-2xl text-base font-medium transition-all flex items-center justify-center gap-3 ${
                      garant === 'oui' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {Icons.check}
                    <span>J'ai un garant</span>
                  </button>
                </div>

                {garant === 'oui' && (
                  <div className="bg-[var(--bg-secondary)] rounded-2xl" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="flex justify-between items-baseline">
                        <label className="text-lg text-[var(--text-secondary)]">Revenus du garant</label>
                        <span className="text-2xl font-semibold text-white">{revenuGarant.toLocaleString()} €/mois</span>
                      </div>
                      <div style={{ padding: '0 8px' }}>
                        <Slider value={[revenuGarant]} onValueChange={(v) => setRevenuGarant(v[0])} min={1500} max={10000} step={250} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <label className="text-lg text-[var(--text-secondary)]">Le garant est...</label>
                      <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                        <button 
                          onClick={() => setGarantProprio(true)} 
                          style={{ padding: '18px' }}
                          className={`rounded-xl font-medium transition-all ${garantProprio ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}
                        >
                          Propriétaire
                        </button>
                        <button 
                          onClick={() => setGarantProprio(false)} 
                          style={{ padding: '18px' }}
                          className={`rounded-xl font-medium transition-all ${!garantProprio ? 'bg-amber-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}
                        >
                          Locataire
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="xl:sticky xl:top-32 xl:self-start" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '550px' }}>
            
            {/* Score */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] text-center" style={{ padding: '56px' }}>
              <div className="relative mx-auto" style={{ width: '240px', height: '240px', marginBottom: '40px' }}>
                <svg className="w-full h-full -rotate-90">
                  <circle cx="120" cy="120" r="105" fill="none" stroke="var(--bg-secondary)" strokeWidth="14" />
                  <circle
                    cx="120" cy="120" r="105" fill="none"
                    stroke={result.blocages.length > 0 ? '#f43f5e' : result.score >= 55 ? '#10b981' : '#f59e0b'}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 660} 660`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-7xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
                    {result.score}
                  </span>
                  <span className="text-xl text-[var(--text-muted)] mt-2">/ 100</span>
                </div>
              </div>
              
              <div 
                style={{ padding: '16px 40px' }}
                className={`inline-flex items-center rounded-full text-xl font-semibold ${
                  result.verdictColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' : 
                  result.verdictColor === 'amber' ? 'bg-amber-500/15 text-amber-400' : 
                  result.verdictColor === 'orange' ? 'bg-orange-500/15 text-orange-400' : 
                  'bg-rose-500/15 text-rose-400'
                }`}
              >
                {result.verdict}
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '32px' }}>
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  {Icons.chart}
                </div>
                <span className="text-xl font-medium text-white">Capacité d'emprunt</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-[var(--text-secondary)]">Mensualité max</span>
                  <span className="text-2xl font-bold text-white">{result.mensualiteMax.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-[var(--text-secondary)]">Emprunt possible</span>
                  <span className="text-2xl font-bold text-emerald-400">{result.capaciteEmprunt.toLocaleString()} €</span>
                </div>
                <div className="h-px bg-[var(--border-color)]" />
                <div className="flex justify-between items-center">
                  <span className="text-lg text-[var(--text-secondary)]">Budget total</span>
                  <span className="text-3xl font-bold text-white">{result.budgetTotal.toLocaleString()} €</span>
                </div>
              </div>
              
              {result.budgetTotal < prixProjet && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl" style={{ marginTop: '28px', padding: '24px' }}>
                  <p className="text-rose-400 text-lg">Budget inférieur de {(prixProjet - result.budgetTotal).toLocaleString()}€ au prix visé</p>
                </div>
              )}
            </div>

            {/* Blockers */}
            {result.blocages.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl" style={{ padding: '40px' }}>
                <div className="flex items-center mb-8" style={{ gap: '16px' }}>
                  <div className="w-14 h-14 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                    {Icons.alert}
                  </div>
                  <span className="text-xl font-medium text-rose-400">Points bloquants</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {result.blocages.map((b, i) => (
                    <li key={i} className="text-lg text-rose-300 flex items-start" style={{ gap: '16px' }}>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-2.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Factors */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
              <p className="text-base text-[var(--text-muted)] mb-8">Détail du score</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {result.facteurs.map((f, i) => (
                  <div key={i} className="flex items-center" style={{ gap: '20px' }}>
                    <span className="text-base text-[var(--text-secondary)]" style={{ width: '100px' }}>{f.nom}</span>
                    <div className="flex-1 h-4 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${getBarColor(f.impact)}`} style={{ width: `${(f.score / f.maxScore) * 100}%` }} />
                    </div>
                    <span className="text-base font-medium text-[var(--text-secondary)]" style={{ width: '60px', textAlign: 'right' }}>{f.score}/{f.maxScore}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            {result.conseils.length > 0 && !result.blocages.length && (
              <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
                <div className="flex items-center mb-8" style={{ gap: '16px' }}>
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    {Icons.lightbulb}
                  </div>
                  <span className="text-xl font-medium text-white">Conseils</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {result.conseils.map((c, i) => (
                    <li key={i} className="text-lg text-[var(--text-secondary)]">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SAVE SECTION - Standalone at bottom */}
      <div 
        className="border-t border-[var(--border-color)]"
        style={{ 
          padding: '80px 48px',
          background: 'linear-gradient(to top, rgba(139, 92, 246, 0.05), transparent)'
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <button
            onClick={isAuthenticated ? savePreferences : () => window.location.href = '/login'}
            disabled={isSaving}
            style={{ 
              padding: '24px 80px', 
              fontSize: '1.25rem',
              borderRadius: '20px',
            }}
            className="font-bold transition-all shadow-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}
