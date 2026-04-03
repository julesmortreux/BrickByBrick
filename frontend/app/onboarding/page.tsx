'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';
import { VilleSearch } from '@/components/VilleSearch';
import dynamic from 'next/dynamic';

// Import dynamique du composant Map
const MapComponentProximite = dynamic(
  () => import('@/components/MapComponentProximite'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '400px' }}>
        Chargement de la carte...
      </div>
    )
  }
);

// Types
interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

interface CommuneSearchResult {
  nom: string;
  code_postal: string | null;
  lat?: number;
  lon?: number;
}

// Icons
const Icons = {
  user: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  home: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  calculator: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  map: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  arrowRight: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  arrowLeft: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>,
  x: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

/* ─── Logo (landing style) ─────────────────────────────────────────────── */
function BrandMark({ height = 34, className = '', priority = false }: { height?: number; className?: string; priority?: boolean }) {
  const w = Math.round((height * 362) / 394);
  return (
    <Image
      src="/logo-mark.png"
      alt="BrickByBrick"
      width={w}
      height={height}
      className={`shrink-0 ${className}`}
      priority={priority}
      unoptimized
      style={{ objectFit: 'contain', objectPosition: 'center' }}
    />
  );
}

function Logo() {
  return (
    <span className="text-xl font-black tracking-tight leading-none">
      <span className="text-white">Brick</span>
      <span className="text-violet-400">By</span>
      <span className="text-white">Brick</span>
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, refreshUser, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Force verticale bordure -> texte (padding/alignement inline pour éviter les effets Tailwind config)
  const SEGMENTED_BTN_FORCE_STYLE = {
    minHeight: 44,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const;

  // Force padding interne des "cards" (bordure -> texte) pour éviter les rendus trop serrés
  const CARD_FORCE_STYLE = {
    padding: 32,
  } as const;

  // Variante plus compacte pour les sous-blocs (toggles, petites cartes)
  const CARD_FORCE_STYLE_SM = {
    padding: 24,
  } as const;

  // Étape 1: Situation personnelle & Projet
  const [statut, setStatut] = useState<'etudiant' | 'alternant' | 'cdi' | 'cdd' | 'fonctionnaire' | 'auto-entrepreneur' | 'retraite' | 'chomeur'>('etudiant');
  const [anciennete, setAnciennete] = useState(0);
  const [revenuMensuel, setRevenuMensuel] = useState(1200);
  const [garantProprio, setGarantProprio] = useState(true);
  const [coBorrower, setCoBorrower] = useState(false);
  const [revenuCoBorrower, setRevenuCoBorrower] = useState(0);
  const [garant, setGarant] = useState<'aucun' | 'oui'>('oui');
  const [revenuGarant, setRevenuGarant] = useState(4000);
  const [prixProjet, setPrixProjet] = useState(150000);
  const [apport, setApport] = useState(15000);
  const [dureeCredit, setDureeCredit] = useState(20);

  // Étape 2: Paramètres crédit
  const [tauxInteret, setTauxInteret] = useState(3.1);
  const [inclureCharges, setInclureCharges] = useState(true);

  // Étape 3: Localisation
  const [villeDomicile, setVilleDomicile] = useState<Ville | null>(null);
  const [villesRelais, setVillesRelais] = useState<Ville[]>([]);
  const [rayon, setRayon] = useState(20);
  const [communesData, setCommunesData] = useState<{ code_postal: string; commune: string; lat: number; lon: number; pct_access: number; prix_median?: number; nb_ventes?: number; distance_min: number }[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);

  // Charger les préférences existantes
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    } else if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, prefsLoaded, router]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    fn();
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response && response.ok) {
        const prefs = await response.json();
        if (prefs) {
          // Étape 1
          if (prefs.statut) setStatut(prefs.statut);
          if (prefs.anciennete !== undefined) setAnciennete(prefs.anciennete);
          if (prefs.revenu_mensuel) setRevenuMensuel(prefs.revenu_mensuel);
          if (prefs.garant_proprio !== undefined) setGarantProprio(prefs.garant_proprio);
          if (prefs.co_borrower !== undefined) setCoBorrower(prefs.co_borrower);
          if (prefs.revenu_co_borrower) setRevenuCoBorrower(prefs.revenu_co_borrower);
          if (prefs.garant) setGarant(prefs.garant);
          if (prefs.revenu_garant) setRevenuGarant(prefs.revenu_garant);
          if (prefs.prix_projet) setPrixProjet(prefs.prix_projet);
          if (prefs.apport) setApport(prefs.apport);
          if (prefs.duree_credit) setDureeCredit(prefs.duree_credit);
          // Étape 2
          // On garde 3.10 par défaut si rien n'est défini côté backend
          if (prefs.taux_interet !== undefined && prefs.taux_interet !== null) {
            setTauxInteret(prefs.taux_interet);
          } else {
            setTauxInteret(3.1);
          }
          // Étape 3
          if (prefs.w5_rayon) setRayon(prefs.w5_rayon);
          if (prefs.w5_ville_domicile) {
            try {
              setVilleDomicile(JSON.parse(prefs.w5_ville_domicile));
            } catch {}
          }
          if (prefs.w5_villes_relais) {
            try {
              setVillesRelais(JSON.parse(prefs.w5_villes_relais));
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  // Constantes pour les calculs
  const BANK_CRITERIA = { tauxEndettementMax: 0.35, tauxInteret: 0.035, assurancePct: 0.0034 };

  // Fonction de calcul de mensualité
  const calculerMensualite = (capital: number, tauxAnnuel: number, dureeAns: number): number => {
    if (capital <= 0 || dureeAns <= 0) return 0;
    const tauxMensuel = tauxAnnuel / 100 / 12;
    const nbMensualites = dureeAns * 12;
    if (tauxMensuel <= 0) return capital / nbMensualites;
    return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1);
  };

  // Calculer le montant emprunté
  const montantEmprunte = useMemo(() => {
    return Math.max(0, prixProjet - apport);
  }, [prixProjet, apport]);

  // Calcul de faisabilité (Étape 1)
  const faisabiliteResult = useMemo(() => {
    const facteurs: { nom: string; score: number; maxScore: number; impact: string }[] = [];
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
    else if (statut === 'auto-entrepreneur') { statutScore = 10; statutImpact = 'negatif'; blocages.push("Auto-entrepreneur : garantie solide requise"); }
    else if (statut === 'retraite') { statutScore = 20; statutImpact = 'positif'; }
    else if (statut === 'chomeur') { statutScore = 0; statutImpact = 'bloquant'; blocages.push("Chômeur : revenus stables requis"); }
    else { statutScore = 3; statutImpact = 'bloquant'; blocages.push("Étudiant : garant obligatoire"); }
    totalScore += statutScore;
    facteurs.push({ nom: 'Situation', score: statutScore, maxScore: 30, impact: statutImpact });

    maxPossibleScore += 25;
    let revenuStable = 0;
    if (statut === 'cdi' || statut === 'fonctionnaire' || statut === 'retraite') revenuStable = revenuMensuel;
    else if (statut === 'alternant') revenuStable = revenuMensuel * 0.7;
    else if (statut === 'cdd' || statut === 'auto-entrepreneur') revenuStable = revenuMensuel * 0.5;
    else if (statut === 'chomeur') revenuStable = revenuMensuel * 0.3;
    if (coBorrower) revenuStable += revenuCoBorrower;
    
    const tauxMensuelCalc = (BANK_CRITERIA.tauxInteret + BANK_CRITERIA.assurancePct) / 12;
    const nbMensualitesCalc = dureeCredit * 12;
    const montantEmprunteCalc = Math.max(0, prixProjet - apport);
    const mensualiteRequise = montantEmprunteCalc > 0 ? montantEmprunteCalc * (tauxMensuelCalc * Math.pow(1 + tauxMensuelCalc, nbMensualitesCalc)) / (Math.pow(1 + tauxMensuelCalc, nbMensualitesCalc) - 1) : 0;
    const revenuNecessaire = mensualiteRequise / 0.35;
    
    let revenuScore = 0;
    let revenuImpact = 'neutre';
    const revenuEffectif = revenuStable > 0 ? revenuStable : (garant !== 'aucun' ? revenuGarant * 0.3 : 0);
    
    if (revenuEffectif <= 0) {
      revenuScore = 0;
      revenuImpact = 'bloquant';
    } else {
      const ratioRevenu = revenuEffectif / revenuNecessaire;
      if (ratioRevenu >= 1.5) { revenuScore = 25; revenuImpact = 'positif'; }
      else if (ratioRevenu >= 1.2) { revenuScore = 22; revenuImpact = 'positif'; }
      else if (ratioRevenu >= 1.0) { revenuScore = 18; }
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
      garantImpact = (statut === 'etudiant' || statut === 'cdd' || statut === 'auto-entrepreneur') ? 'bloquant' : 'negatif';
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

    return { 
      capaciteEmprunt: Math.round(capaciteEmprunt), 
      mensualiteMax: Math.round(capaciteRemboursement), 
      budgetTotal: Math.round(capaciteEmprunt + apport), 
      tauxEndettement, 
      score: finalScore, 
      verdict, 
      verdictColor, 
      facteurs, 
      conseils, 
      blocages 
    };
  }, [statut, anciennete, revenuMensuel, coBorrower, revenuCoBorrower, apport, dureeCredit, prixProjet, garant, revenuGarant, garantProprio, montantEmprunte]);

  // Calcul de rendement (Étape 2)
  const rendementResult = useMemo(() => {
    const prixTotal = apport + montantEmprunte;
    const mensualite = calculerMensualite(montantEmprunte, tauxInteret, dureeCredit);
    const annuite = mensualite * 12;
    const coefNet = inclureCharges ? 0.8 : 1.0;
    const loyerAnnuelBrut = annuite / coefNet;
    const loyerMensuelBrut = loyerAnnuelBrut / 12;
    const rendementRequis = prixTotal > 0 ? (loyerAnnuelBrut / prixTotal) * 100 : 0;

    let status: 'excellent' | 'bon' | 'moyen' | 'eleve';
    let statusLabel: string;
    let statusEmoji: string;
    let message: string;

    if (rendementRequis <= 4.5) {
      status = 'excellent';
      statusLabel = 'Excellent';
      statusEmoji = 'OK';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre projet présente un excellent rendement pour un investissement locatif.`;
    } else if (rendementRequis <= 7.0) {
      status = 'bon';
      statusLabel = 'Bon';
      statusEmoji = 'OK';
      message = `Un rendement de ${rendementRequis.toFixed(2)}% est dans la moyenne du marché locatif français.`;
    } else if (rendementRequis <= 9.0) {
      status = 'moyen';
      statusLabel = 'Moyen';
      statusEmoji = 'OK';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre marge est serrée. Privilégiez les zones très tendues.`;
    } else {
      status = 'eleve';
      statusLabel = 'Élevé';
      statusEmoji = 'OK';
      message = `À ${rendementRequis.toFixed(2)}%, il sera difficile de trouver un locataire acceptant ce loyer.`;
    }

    return {
      prixTotal,
      mensualite,
      loyerMensuelRequis: loyerMensuelBrut,
      rendementRequis,
      status,
      statusLabel,
      statusEmoji,
      message,
    };
  }, [apport, montantEmprunte, tauxInteret, dureeCredit, inclureCharges]);

  // Centre de la carte pour l'étape 3
  const mapCenter = useMemo(() => {
    const villes = [villeDomicile, ...villesRelais].filter(Boolean) as Ville[];
    if (villes.length === 0) {
      return { lat: 46.5, lon: 2.5, zoom: 6 };
    }
    const lats = villes.filter(v => v.lat).map(v => v.lat!);
    const lons = villes.filter(v => v.lon).map(v => v.lon!);
    if (lats.length === 0 || lons.length === 0) {
      return { lat: 46.5, lon: 2.5, zoom: 6 };
    }
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
    return { lat: avgLat, lon: avgLon, zoom: villes.length === 1 ? 10 : 8 };
  }, [villeDomicile, villesRelais]);

  // Charger les communes pour la carte
  useEffect(() => {
    const fetchCommunes = async () => {
      const villesList: Ville[] = [];
      if (villeDomicile) villesList.push(villeDomicile);
      villesList.push(...villesRelais);

      if (villesList.length === 0 || prixProjet <= 0) {
        setCommunesData([]);
        return;
      }

      const villesAvecCoords = villesList.filter(v => v.lat && v.lon);
      if (villesAvecCoords.length === 0) {
        setCommunesData([]);
        return;
      }

      setIsLoadingCommunes(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const villesStr = villesAvecCoords
          .map(v => `${v.nom}:${v.code_postal}`)
          .join(',');

        const url = new URL(`${apiUrl}/api/proximite/communes`);
        url.searchParams.set('villes', villesStr);
        url.searchParams.set('rayon_km', rayon.toString());
        url.searchParams.set('budget_max', prixProjet.toString());

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setCommunesData(data.communes || []);
        } else {
          setCommunesData([]);
        }
      } catch (error) {
        console.error('Erreur chargement communes:', error);
        setCommunesData([]);
      } finally {
        setIsLoadingCommunes(false);
      }
    };

    if (currentStep === 3) {
      fetchCommunes();
    }
  }, [villeDomicile, villesRelais, rayon, prixProjet, currentStep]);

  // Validation des étapes
  const validateStep1 = () => {
    if (prixProjet <= 0 || apport < 0 || dureeCredit <= 0) return false;
    if (revenuMensuel <= 0) return false;
    if (garant === 'oui' && revenuGarant <= 0) return false;
    if (coBorrower && revenuCoBorrower <= 0) return false;
    return true;
  };

  const validateStep2 = () => {
    return tauxInteret > 0 && tauxInteret <= 10;
  };

  const validateStep3 = () => {
    return villeDomicile !== null;
  };

  // Sauvegarder l'étape actuelle
  const saveStep = async (step: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const getResponse = await authFetch('/auth/preferences');
      let existingPrefs = {};
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data) existingPrefs = data;
      }

      let updateData: any = { ...existingPrefs };

      if (step >= 1) {
        updateData = {
          ...updateData,
          statut,
          anciennete,
          revenu_mensuel: revenuMensuel,
          co_borrower: coBorrower,
          revenu_co_borrower: revenuCoBorrower,
          garant,
          revenu_garant: revenuGarant,
          garant_proprio: garantProprio,
          prix_projet: prixProjet,
          apport,
          duree_credit: dureeCredit,
        };
      }

      if (step >= 2) {
        updateData = {
          ...updateData,
          taux_interet: tauxInteret,
        };
      }

      if (step >= 3) {
        updateData = {
          ...updateData,
          w5_rayon: rayon,
          w5_ville_domicile: villeDomicile ? JSON.stringify(villeDomicile) : null,
          w5_villes_relais: villesRelais.length > 0 ? JSON.stringify(villesRelais) : null,
        };
      }

      const response = await authFetch('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error saving step:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving step:', error);
      return false;
    }
  };

  // Passer à l'étape suivante
  const nextStep = async () => {
    if (currentStep === 1 && !validateStep1()) {
      alert('Veuillez remplir tous les champs obligatoires de l\'étape 1');
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      alert('Veuillez entrer un taux d\'intérêt valide (entre 0 et 10%)');
      return;
    }
    if (currentStep === 3 && !validateStep3()) {
      alert('Veuillez sélectionner votre ville domicile');
      return;
    }

    setIsSaving(true);
    const saved = await saveStep(currentStep);
    setIsSaving(false);

    if (!saved) {
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finaliser l'onboarding
      await completeOnboarding();
    }
  };

  // Étape précédente
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Finaliser l'onboarding
  const completeOnboarding = async () => {
    setIsSaving(true);
    try {
      // Les données de l'étape 3 ont déjà été sauvegardées dans nextStep
      // Marquer l'onboarding comme complété
      const response = await authFetch('/auth/onboarding/complete', {
        method: 'PUT',
      });

      if (response.ok) {
        const result = await response.json();
        
        // Rafraîchir les données utilisateur depuis le serveur
        try {
          await refreshUser();
        } catch (refreshError) {
          console.warn('Failed to refresh user, but onboarding is completed:', refreshError);
          // Mettre à jour manuellement le localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              user.onboarding_completed = true;
              localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
              console.error('Failed to update localStorage:', e);
            }
          }
        }
        
        // Rediriger vers le tableau de bord
        router.push('/dashboard');
      } else {
        let errorMessage = 'Erreur lors de la finalisation de l\'onboarding';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Erreur serveur (${response.status})`;
        }
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (error) {
      let errorMessage = 'Erreur lors de la finalisation de l\'onboarding';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est lancé sur http://localhost:8000';
        }
      }
      alert(`Erreur: ${errorMessage}`);
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Ajouter ville relais
  const handleSelectRelais = (ville: Ville) => {
    if (!villesRelais.find(v => v.nom === ville.nom && v.code_postal === ville.code_postal)) {
      setVillesRelais(prev => [...prev, ville]);
    }
  };

  // Supprimer ville relais
  const removeVilleRelais = (index: number) => {
    setVillesRelais(villesRelais.filter((_, i) => i !== index));
  };

  if (!isAuthenticated || !prefsLoaded) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Chargement...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-white relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-grid" />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-noise" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.20) 0%, transparent 60%)' }}
      />
      {/* Navigation Bar */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            width: '100%',
            maxWidth: 1152,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 32,
            paddingRight: 32,
            boxSizing: 'border-box',
            height: 72,
          }}
        >
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3" style={{ marginLeft: 12 }}>
              <BrandMark height={34} priority className="leading-none translate-y-[-4px]" />
              <Logo />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                borderRadius: '40px',
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                padding: '14px 32px',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="fixed top-[73px] left-0 right-0 h-1 bg-[var(--bg-secondary)] z-40">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div>
        {/* Spacer: offset fixe sous la navbar + barre de progression */}
        <div aria-hidden style={{ height: 120 }} />
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px 80px 32px' }}>
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Étape {currentStep} sur 3
            </div>
            <div aria-hidden style={{ height: 24 }} />
            <h1 className="text-4xl font-bold text-white">
              {currentStep === 1 && 'Votre situation et votre projet'}
              {currentStep === 2 && 'Paramètres du crédit'}
              {currentStep === 3 && 'Localisation'}
            </h1>
            <div aria-hidden style={{ height: 16 }} />
            <p className="text-lg text-[var(--text-secondary)]" style={{ margin: 0 }}>
              {currentStep === 1 && 'Renseignez vos informations personnelles et votre projet d\'achat'}
              {currentStep === 2 && 'Configurez les paramètres de votre crédit immobilier'}
              {currentStep === 3 && 'Indiquez votre localisation et vos villes d\'intérêt'}
            </p>
            <div aria-hidden style={{ height: 56 }} />
          </div>

          {/* Step Content */}
          <div
            className="glass-card rounded-3xl border border-[var(--border-color)]"
            style={{ padding: '76px', boxShadow: '0 40px 120px rgba(0,0,0,0.35)' }}
          >
            {/* Étape 1: Situation & Projet */}
            {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {/* Situation personnelle */}
                <section>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                      {Icons.user}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Situation personnelle</h2>
                  </div>

                  <div aria-hidden style={{ height: 48 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                    {/* Statut */}
                    <div>
                      <label className="text-xl font-medium text-[var(--text-secondary)] mb-0 block">Statut professionnel</label>
                      <div aria-hidden style={{ height: 16 }} />
                      <select
                        value={statut}
                        onChange={(e) => setStatut(e.target.value as any)}
                        className="w-full px-6 py-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      >
                        <option value="etudiant">Étudiant</option>
                        <option value="alternant">Alternant</option>
                        <option value="cdi">CDI</option>
                        <option value="cdd">CDD</option>
                        <option value="fonctionnaire">Fonctionnaire</option>
                        <option value="auto-entrepreneur">Auto-entrepreneur</option>
                        <option value="retraite">Retraité</option>
                        <option value="chomeur">Chômeur</option>
                      </select>
                    </div>

                    {/* Ancienneté */}
                    {statut === 'cdi' && (
                      <div>
                        <div className="flex justify-between items-baseline mb-0">
                          <label className="text-lg text-[var(--text-secondary)]">Ancienneté (mois)</label>
                          <span className="text-2xl font-bold text-white">{anciennete} mois</span>
                        </div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div style={{ padding: '0 8px' }}>
                          <Slider value={[anciennete]} onValueChange={(v) => setAnciennete(v[0])} min={0} max={120} step={1} />
                        </div>
                      </div>
                    )}

                    {/* Revenu mensuel */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Revenu mensuel net</label>
                        <span className="text-4xl font-bold text-white">{revenuMensuel.toLocaleString()} €</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[revenuMensuel]} onValueChange={(v) => setRevenuMensuel(v[0])} min={0} max={10000} step={50} />
                      </div>
                    </div>

                    {/* Co-emprunteur */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6" style={CARD_FORCE_STYLE_SM}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-lg text-[var(--text-secondary)]">Co-emprunteur</label>
                        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                          <button
                            type="button"
                            onClick={() => setCoBorrower(true)}
                            className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                              coBorrower
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                            }`}
                            style={SEGMENTED_BTN_FORCE_STYLE}
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoBorrower(false)}
                            className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                              !coBorrower
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                            }`}
                            style={SEGMENTED_BTN_FORCE_STYLE}
                          >
                            Non
                          </button>
                        </div>
                      </div>
                      {coBorrower && (
                        <div className="mt-4">
                          <div className="flex justify-between items-baseline mb-0">
                            <label className="text-sm text-[var(--text-secondary)]">Revenu co-emprunteur</label>
                            <span className="text-xl font-bold text-white">{revenuCoBorrower.toLocaleString()} €</span>
                          </div>
                          <div aria-hidden style={{ height: 12 }} />
                          <div style={{ padding: '0 8px' }}>
                            <Slider value={[revenuCoBorrower]} onValueChange={(v) => setRevenuCoBorrower(v[0])} min={0} max={10000} step={50} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Garant */}
                    <div>
                      <label className="text-lg text-[var(--text-secondary)] mb-0 block">Garant</label>
                      <div aria-hidden style={{ height: 16 }} />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setGarant('oui')}
                          className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                            garant === 'oui'
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                              : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                          }`}
                          style={SEGMENTED_BTN_FORCE_STYLE}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setGarant('aucun')}
                          className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                            garant === 'aucun'
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                              : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                          }`}
                          style={SEGMENTED_BTN_FORCE_STYLE}
                        >
                          Non
                        </button>
                      </div>
                      {garant === 'oui' && (
                        <div>
                          <div aria-hidden style={{ height: 16 }} />
                          <div>
                            <div className="flex justify-between items-baseline mb-0">
                              <label className="text-sm text-[var(--text-secondary)]">Revenu garant</label>
                              <span className="text-xl font-bold text-white">{revenuGarant.toLocaleString()} €</span>
                            </div>
                            <div aria-hidden style={{ height: 12 }} />
                            <div style={{ padding: '0 8px' }}>
                              <Slider value={[revenuGarant]} onValueChange={(v) => setRevenuGarant(v[0])} min={0} max={10000} step={100} />
                            </div>
                            <div aria-hidden style={{ height: 16 }} />
                          </div>
                          <div className="bg-[var(--bg-card)] rounded-xl p-6" style={CARD_FORCE_STYLE_SM}>
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-[var(--text-secondary)]">Garant propriétaire</label>
                              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => setGarantProprio(true)}
                                  className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                                    garantProprio
                                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                      : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                                  }`}
                                  style={SEGMENTED_BTN_FORCE_STYLE}
                                >
                                  Oui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGarantProprio(false)}
                                  className={`flex-1 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                                    !garantProprio
                                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                      : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                                  }`}
                                  style={SEGMENTED_BTN_FORCE_STYLE}
                                >
                                  Non
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Spacer entre Situation et Projet */}
                <div aria-hidden style={{ height: 72 }} />

                {/* Projet */}
                <section>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                      {Icons.home}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Votre projet</h2>
                  </div>

                  <div aria-hidden style={{ height: 48 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Prix du bien */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Prix du bien</label>
                        <span className="text-4xl font-bold text-white">{prixProjet.toLocaleString()} €</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[prixProjet]} onValueChange={(v) => setPrixProjet(v[0])} min={50000} max={500000} step={5000} />
                      </div>
                    </div>

                    {/* Apport */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Apport</label>
                        <span className="text-4xl font-bold text-white">{apport.toLocaleString()} €</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={200000} step={1000} />
                      </div>
                    </div>

                    {/* Durée crédit */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Durée du crédit</label>
                        <span className="text-4xl font-bold text-white">{dureeCredit} ans</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={5} max={25} step={1} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Résultats Faisabilité */}
                <div aria-hidden style={{ height: 72 }} />
                <section>
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-3xl border border-violet-500/20" style={{ padding: '56px' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                        {Icons.calculator}
                      </div>
                      <h2 className="text-3xl font-semibold text-white">Aperçu de votre faisabilité</h2>
                    </div>
                    <div aria-hidden style={{ height: 48 }} />

                    {/* Score */}
                    <div className="text-center">
                      <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Score de Faisabilité
                      </div>
                      <div aria-hidden style={{ height: 16 }} />
                      <div className="text-8xl font-extrabold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                        {faisabiliteResult.score}
                        <span className="text-4xl">/100</span>
                      </div>
                      <div aria-hidden style={{ height: 16 }} />
                      <div className="inline-flex items-center px-8 py-4 rounded-full text-xl font-semibold bg-violet-500/15 text-violet-400">
                        {faisabiliteResult.verdict}
                      </div>
                    </div>
                    <div aria-hidden style={{ height: 48 }} />

                    {/* Budget accessible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]" style={CARD_FORCE_STYLE}>
                        <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Budget accessible</div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div className="text-3xl font-bold text-white">{faisabiliteResult.budgetTotal.toLocaleString()} €</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]" style={CARD_FORCE_STYLE}>
                        <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Capacité d'emprunt</div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div className="text-3xl font-bold text-violet-400">{faisabiliteResult.capaciteEmprunt.toLocaleString()} €</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]" style={CARD_FORCE_STYLE}>
                        <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Mensualité max</div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div className="text-3xl font-bold text-white">{faisabiliteResult.mensualiteMax.toLocaleString()} €</div>
                      </div>
                    </div>
                    <div aria-hidden style={{ height: 40 }} />

                    {/* Facteurs */}
                    <div>
                      {faisabiliteResult.facteurs.map((facteur, idx) => {
                        const percent = (facteur.score / facteur.maxScore) * 100;
                        const colorClass =
                          facteur.impact === 'bloquant' ? 'bg-rose-500' : 'bg-violet-500';
                        return (
                          <div key={idx}>
                            <div className="flex justify-between items-center">
                              <span className="text-base font-medium text-[var(--text-secondary)]">{facteur.nom}</span>
                              <span className="text-base font-semibold text-white">{facteur.score}/{facteur.maxScore}</span>
                            </div>
                            <div aria-hidden style={{ height: 12 }} />
                            <div className="h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div className={`h-full ${colorClass} transition-all duration-300 rounded-full`} style={{ width: `${percent}%` }} />
                            </div>
                            {idx < faisabiliteResult.facteurs.length - 1 && <div aria-hidden style={{ height: 20 }} />}
                          </div>
                        );
                      })}
                    </div>
                    <div aria-hidden style={{ height: 40 }} />

                    {/* Conseils et blocages */}
                    {faisabiliteResult.conseils.length > 0 && (
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-8" style={CARD_FORCE_STYLE}>
                        <div className="flex items-center gap-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'rgb(167,139,250)' }}>
                            <path d="M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M8 10a4 4 0 118 0c0 2-1 3-2 4H10c-1-1-2-2-2-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          </svg>
                          <div className="text-base font-semibold text-violet-400">Conseils</div>
                        </div>
                        <div aria-hidden style={{ height: 16 }} />
                        <div className="flex flex-col">
                          {faisabiliteResult.conseils.map((conseil, idx) => (
                            <div key={idx}>
                              <div className="text-base text-violet-300">• {conseil}</div>
                              {idx < faisabiliteResult.conseils.length - 1 && <div aria-hidden style={{ height: 12 }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {faisabiliteResult.conseils.length > 0 && faisabiliteResult.blocages.length > 0 && (
                      <div aria-hidden style={{ height: 24 }} />
                    )}

                    {faisabiliteResult.blocages.length > 0 && (
                      <div
                        className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8"
                        style={CARD_FORCE_STYLE}
                      >
                        <div className="flex items-center gap-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'rgb(251,113,133)' }}>
                            <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path
                              d="M10.29 3.86l-7.4 13.17A2 2 0 004.6 20h14.8a2 2 0 001.71-2.97l-7.4-13.17a2 2 0 00-3.42 0z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="text-base font-semibold text-rose-400">Points d'attention</div>
                        </div>
                        <div aria-hidden style={{ height: 16 }} />
                        <div className="flex flex-col">
                          {faisabiliteResult.blocages.map((blocage, idx) => (
                            <div key={idx}>
                              <div className="text-base text-rose-300">• {blocage}</div>
                              {idx < faisabiliteResult.blocages.length - 1 && <div aria-hidden style={{ height: 12 }} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Étape 2: Paramètres crédit */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <section>
                  <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                      {Icons.calculator}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Paramètres du crédit</h2>
                  </div>

                  <div aria-hidden style={{ height: 48 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                    {/* Informations pré-remplies */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-8" style={CARD_FORCE_STYLE}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Récapitulatif de votre projet</h3>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]"
                          style={SEGMENTED_BTN_FORCE_STYLE}
                        >
                          {Icons.arrowLeft}
                          Modifier
                        </button>
                      </div>
                      <div aria-hidden style={{ height: 20 }} />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-[var(--text-muted)] mb-1">Prix du bien</div>
                          <div className="text-xl font-bold text-white">{prixProjet.toLocaleString()} €</div>
                        </div>
                        <div>
                          <div className="text-sm text-[var(--text-muted)] mb-1">Apport</div>
                          <div className="text-xl font-bold text-white">{apport.toLocaleString()} €</div>
                        </div>
                        <div>
                          <div className="text-sm text-[var(--text-muted)] mb-1">Montant emprunté</div>
                          <div className="text-xl font-bold text-violet-400">{montantEmprunte.toLocaleString()} €</div>
                        </div>
                        <div>
                          <div className="text-sm text-[var(--text-muted)] mb-1">Durée</div>
                          <div className="text-xl font-bold text-white">{dureeCredit} ans</div>
                        </div>
                      </div>
                    </div>

                    {/* Taux d'intérêt */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Taux d'intérêt annuel</label>
                        <span className="text-4xl font-bold text-white">{tauxInteret.toFixed(2)}%</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[tauxInteret * 100]} onValueChange={(v) => setTauxInteret(v[0] / 100)} min={10} max={800} step={5} />
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div className="flex justify-between text-sm text-[var(--text-muted)]">
                        <span>0,1%</span>
                        <span>8%</span>
                      </div>
                    </div>

                    {/* Inclure charges */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-8" style={CARD_FORCE_STYLE}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white mb-1">Inclure 20% de charges locatives</div>
                          <div className="text-sm text-[var(--text-muted)]">Taxe foncière, charges, vacance, gestion...</div>
                        </div>
                        <button
                          onClick={() => setInclureCharges(!inclureCharges)}
                          className={`px-8 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                            inclureCharges
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                            : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                          }`}
                          style={SEGMENTED_BTN_FORCE_STYLE}
                        >
                          {inclureCharges ? 'Oui' : 'Non'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Résultats Rendement */}
                <div aria-hidden style={{ height: 72 }} />
                <section>
                  <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 rounded-3xl border border-violet-500/20" style={{ padding: '56px' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                        {Icons.calculator}
                      </div>
                      <h2 className="text-3xl font-semibold text-white">Aperçu du rendement requis</h2>
                    </div>
                    <div aria-hidden style={{ height: 48 }} />

                    {/* Rendement */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'rgb(167,139,250)' }}>
                          <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                        <span>Rendement Brut Minimal Requis</span>
                      </div>
                      <div aria-hidden style={{ height: 16 }} />
                      <div className="text-8xl font-extrabold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                        {rendementResult.rendementRequis.toFixed(2)}%
                      </div>
                      <div aria-hidden style={{ height: 16 }} />
                      <div className="inline-flex items-center px-8 py-4 rounded-full text-xl font-semibold bg-violet-500/15 text-violet-400">
                        {rendementResult.statusLabel}
                      </div>
                    </div>
                    <div aria-hidden style={{ height: 48 }} />

                    {/* Détails */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]" style={CARD_FORCE_STYLE}>
                        <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Mensualité crédit</div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div className="text-3xl font-bold text-white">{rendementResult.mensualite.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border-color)]" style={CARD_FORCE_STYLE}>
                        <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Loyer mensuel requis</div>
                        <div aria-hidden style={{ height: 12 }} />
                        <div className="text-3xl font-bold text-violet-400">
                          {rendementResult.loyerMensuelRequis.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/mois
                        </div>
                      </div>
                    </div>
                    <div aria-hidden style={{ height: 40 }} />

                    {/* Message */}
                      <div className="rounded-2xl border-l-4 p-8 bg-violet-500/10 border-violet-500" style={CARD_FORCE_STYLE}>
                        <p className="text-base text-violet-300">
                        {rendementResult.message}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Étape 3: Localisation */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <section>
                  <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                      {Icons.map}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Localisation</h2>
                  </div>

                  <div aria-hidden style={{ height: 48 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                    {/* Ville domicile */}
                    <div>
                      <label className="text-lg font-semibold text-white mb-0 block">Où habitez-vous ? *</label>
                      <div aria-hidden style={{ height: 12 }} />
                      <p className="text-sm text-[var(--text-muted)]" style={{ margin: 0 }}>
                        Votre lieu de résidence principal, utilisé pour calculer les temps de trajet et les zones accessibles autour de chez vous
                      </p>
                      <div aria-hidden style={{ height: 16 }} />
                      {villeDomicile ? (
                        <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-violet-500/20" style={CARD_FORCE_STYLE}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                                {Icons.home}
                              </div>
                              <div>
                                <div className="text-white font-semibold">{villeDomicile.nom}</div>
                                {villeDomicile.code_postal && (
                                  <div className="text-sm text-[var(--text-muted)]">{villeDomicile.code_postal}</div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setVilleDomicile(null)}
                              className="w-10 h-10 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center text-violet-400 transition-colors"
                            >
                              {Icons.x}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <VilleSearch
                          placeholder="Rechercher votre ville domicile..."
                          onSelect={(ville) => setVilleDomicile(ville)}
                        />
                      )}
                    </div>

                    {/* Villes d'intérêt */}
                    <div>
                      <label className="text-lg font-semibold text-white mb-0 block">
                        Villes d'intérêt <span className="text-sm font-normal text-[var(--text-muted)]">(optionnel)</span>
                      </label>
                      <div aria-hidden style={{ height: 12 }} />
                      <p className="text-sm text-[var(--text-muted)]" style={{ margin: 0 }}>
                        Autres villes où vous envisagez d'investir, résidence secondaire, famille, lieu de travail...
                      </p>
                      <div aria-hidden style={{ height: 16 }} />
                      <VilleSearch
                        placeholder="Ajouter une ville..."
                        onSelect={handleSelectRelais}
                      />
                      {villesRelais.length > 0 && (
                        <div>
                          <div aria-hidden style={{ height: 16 }} />
                          {villesRelais.map((ville, index) => (
                            <div key={index}>
                              <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-violet-500/20" style={CARD_FORCE_STYLE_SM}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                                    {Icons.map}
                                  </div>
                                  <div>
                                    <div className="text-white font-medium text-sm">{ville.nom}</div>
                                    {ville.code_postal && (
                                      <div className="text-xs text-[var(--text-muted)]">{ville.code_postal}</div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeVilleRelais(index)}
                                  className="w-8 h-8 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center text-violet-400 transition-colors"
                                >
                                  {Icons.x}
                                </button>
                              </div>
                            </div>
                              {index < villesRelais.length - 1 && <div aria-hidden style={{ height: 12 }} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rayon */}
                    <div>
                      <div className="flex justify-between items-baseline mb-0">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Rayon de recherche</label>
                        <span className="text-4xl font-bold text-white">{rayon} km</span>
                      </div>
                      <div aria-hidden style={{ height: 12 }} />
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[rayon]} onValueChange={(v) => setRayon(v[0])} min={5} max={50} step={5} />
                      </div>
                    </div>

                    {/* Carte */}
                    {(villeDomicile || villesRelais.length > 0) && (
                      <div>
                        <div aria-hidden style={{ height: 8 }} />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                            {Icons.map}
                          </div>
                          <h3 className="text-xl font-semibold text-white">Vue d'ensemble de vos villes</h3>
                        </div>
                        <div aria-hidden style={{ height: 16 }} />
                        <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]" style={{ height: '500px' }}>
                          {isLoadingCommunes ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                              Chargement des municipalités...
                            </div>
                          ) : (
                            <MapComponentProximite
                              villes={[villeDomicile, ...villesRelais].filter(Boolean) as Ville[]}
                              communesData={communesData}
                              mapCenter={mapCenter}
                              rayon={rayon}
                              budget={prixProjet}
                              maxVentes={communesData.length > 0 ? Math.max(...communesData.map(c => c.nb_ventes || 1)) : 1}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div aria-hidden style={{ height: 40 }} />
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || isSaving}
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                currentStep === 1 || isSaving
                  ? 'bg-white/5 text-[var(--text-secondary)] border border-white/10 shadow-none disabled:opacity-100 disabled:cursor-not-allowed hover:bg-white/7 hover:border-white/20 hover:text-white'
                  : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 shadow-none disabled:opacity-100 disabled:cursor-not-allowed hover:bg-white/7 hover:border-white/20 hover:text-white'
              }`}
              style={SEGMENTED_BTN_FORCE_STYLE}
            >
              {Icons.arrowLeft}
              Précédent
            </button>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === currentStep
                      ? 'w-8 bg-violet-500'
                      : step < currentStep
                      ? 'bg-violet-500/50'
                      : 'bg-[var(--bg-secondary)]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={isSaving}
              className={`inline-flex items-center justify-center gap-2 px-10 py-4 rounded-[40px] text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px ${
                isSaving
                  ? 'bg-white/5 text-[var(--text-secondary)] border border-white/10 shadow-none disabled:opacity-100 disabled:cursor-not-allowed hover:bg-white/7 hover:border-white/20 hover:text-white'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)] disabled:opacity-100 disabled:cursor-not-allowed'
              }`}
              style={SEGMENTED_BTN_FORCE_STYLE}
            >
              {currentStep === 3 ? 'Terminer' : 'Suivant'}
              {currentStep < 3 && Icons.arrowRight}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
