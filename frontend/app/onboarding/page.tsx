'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

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
  const [tauxInteret, setTauxInteret] = useState(3.5);
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
          if (prefs.taux_interet) setTauxInteret(prefs.taux_interet);
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
      statusEmoji = '🟢';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre projet présente un excellent rendement pour un investissement locatif.`;
    } else if (rendementRequis <= 7.0) {
      status = 'bon';
      statusLabel = 'Bon';
      statusEmoji = '🔵';
      message = `Un rendement de ${rendementRequis.toFixed(2)}% est dans la moyenne du marché locatif français.`;
    } else if (rendementRequis <= 9.0) {
      status = 'moyen';
      statusLabel = 'Moyen';
      statusEmoji = '🟡';
      message = `Avec ${rendementRequis.toFixed(2)}%, votre marge est serrée. Privilégiez les zones très tendues.`;
    } else {
      status = 'eleve';
      statusLabel = 'Élevé';
      statusEmoji = '🔴';
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
        
        // Rediriger vers la page d'accueil
        router.push('/');
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold">
              <span className="text-white">Brick</span>
              <span className="text-[var(--primary-light)]">ByBrick</span>
            </span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)] text-sm">Configuration initiale</span>
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
      <div style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px 80px 48px' }}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Étape {currentStep} sur 3
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {currentStep === 1 && 'Votre situation et votre projet'}
              {currentStep === 2 && 'Paramètres du crédit'}
              {currentStep === 3 && 'Localisation'}
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              {currentStep === 1 && 'Renseignez vos informations personnelles et votre projet d\'achat'}
              {currentStep === 2 && 'Configurez les paramètres de votre crédit immobilier'}
              {currentStep === 3 && 'Indiquez votre localisation et vos villes d\'intérêt'}
            </p>
          </div>

          {/* Step Content */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '64px' }}>
            {/* Étape 1: Situation & Projet */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                {/* Situation personnelle */}
                <section>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                      {Icons.user}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Situation personnelle</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Statut */}
                    <div>
                      <label className="text-xl font-medium text-[var(--text-secondary)] mb-6 block">Statut professionnel</label>
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
                        <div className="flex justify-between items-baseline mb-3">
                          <label className="text-lg text-[var(--text-secondary)]">Ancienneté (mois)</label>
                          <span className="text-2xl font-bold text-white">{anciennete} mois</span>
                        </div>
                        <div style={{ padding: '0 8px' }}>
                          <Slider value={[anciennete]} onValueChange={(v) => setAnciennete(v[0])} min={0} max={120} step={1} />
                        </div>
                      </div>
                    )}

                    {/* Revenu mensuel */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Revenu mensuel net</label>
                        <span className="text-4xl font-bold text-white">{revenuMensuel.toLocaleString()} €</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[revenuMensuel]} onValueChange={(v) => setRevenuMensuel(v[0])} min={0} max={10000} step={50} />
                      </div>
                    </div>

                    {/* Co-emprunteur */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-lg text-[var(--text-secondary)]">Co-emprunteur</label>
                        <button
                          onClick={() => setCoBorrower(!coBorrower)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            coBorrower ? 'bg-violet-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                          }`}
                        >
                          {coBorrower ? 'Oui' : 'Non'}
                        </button>
                      </div>
                      {coBorrower && (
                        <div className="mt-4">
                          <div className="flex justify-between items-baseline mb-3">
                            <label className="text-sm text-[var(--text-secondary)]">Revenu co-emprunteur</label>
                            <span className="text-xl font-bold text-white">{revenuCoBorrower.toLocaleString()} €</span>
                          </div>
                          <div style={{ padding: '0 8px' }}>
                            <Slider value={[revenuCoBorrower]} onValueChange={(v) => setRevenuCoBorrower(v[0])} min={0} max={10000} step={50} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Garant */}
                    <div>
                      <label className="text-lg text-[var(--text-secondary)] mb-3 block">Garant</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setGarant('oui')}
                          className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            garant === 'oui'
                              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setGarant('aucun')}
                          className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            garant === 'aucun'
                              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                      {garant === 'oui' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="flex justify-between items-baseline mb-3">
                              <label className="text-sm text-[var(--text-secondary)]">Revenu garant</label>
                              <span className="text-xl font-bold text-white">{revenuGarant.toLocaleString()} €</span>
                            </div>
                            <div style={{ padding: '0 8px' }}>
                              <Slider value={[revenuGarant]} onValueChange={(v) => setRevenuGarant(v[0])} min={0} max={10000} step={100} />
                            </div>
                          </div>
                          <div className="bg-[var(--bg-card)] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-[var(--text-secondary)]">Garant propriétaire</label>
                              <button
                                onClick={() => setGarantProprio(!garantProprio)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                  garantProprio ? 'bg-violet-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                                }`}
                              >
                                {garantProprio ? 'Oui' : 'Non'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Projet */}
                <section>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center text-cyan-400">
                      {Icons.home}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Votre projet</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Prix du bien */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Prix du bien</label>
                        <span className="text-4xl font-bold text-white">{prixProjet.toLocaleString()} €</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[prixProjet]} onValueChange={(v) => setPrixProjet(v[0])} min={50000} max={500000} step={5000} />
                      </div>
                    </div>

                    {/* Apport */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Apport</label>
                        <span className="text-4xl font-bold text-white">{apport.toLocaleString()} €</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={200000} step={1000} />
                      </div>
                    </div>

                    {/* Durée crédit */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Durée du crédit</label>
                        <span className="text-4xl font-bold text-white">{dureeCredit} ans</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={5} max={30} step={1} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Résultats Faisabilité */}
                <section className="mt-12">
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-3xl border border-violet-500/20" style={{ padding: '56px' }}>
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center text-violet-400">
                        {Icons.calculator}
                      </div>
                      <h2 className="text-3xl font-semibold text-white">Aperçu de votre faisabilité</h2>
                    </div>

                    {/* Score */}
                    <div className="text-center mb-12">
                      <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                        Score de Faisabilité
                      </div>
                      <div className={`text-8xl font-extrabold bg-gradient-to-r ${
                        faisabiliteResult.verdictColor === 'rose' ? 'from-rose-500 to-red-400' :
                        faisabiliteResult.verdictColor === 'emerald' ? 'from-emerald-500 to-green-400' :
                        faisabiliteResult.verdictColor === 'amber' ? 'from-amber-500 to-yellow-400' :
                        'from-orange-500 to-rose-400'
                      } bg-clip-text text-transparent mb-4`}>
                        {faisabiliteResult.score}
                        <span className="text-4xl">/100</span>
                      </div>
                      <div className={`inline-flex items-center px-8 py-4 rounded-full text-xl font-semibold ${
                        faisabiliteResult.verdictColor === 'rose' ? 'bg-rose-500/15 text-rose-400' :
                        faisabiliteResult.verdictColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                        faisabiliteResult.verdictColor === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-orange-500/15 text-orange-400'
                      }`}>
                        {faisabiliteResult.verdict}
                      </div>
                    </div>

                    {/* Budget accessible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Budget accessible</div>
                        <div className="text-3xl font-bold text-white">{faisabiliteResult.budgetTotal.toLocaleString()} €</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Capacité d'emprunt</div>
                        <div className="text-3xl font-bold text-cyan-400">{faisabiliteResult.capaciteEmprunt.toLocaleString()} €</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Mensualité max</div>
                        <div className="text-3xl font-bold text-white">{faisabiliteResult.mensualiteMax.toLocaleString()} €</div>
                      </div>
                    </div>

                    {/* Facteurs */}
                    <div className="space-y-5 mb-10">
                      {faisabiliteResult.facteurs.map((facteur, idx) => {
                        const percent = (facteur.score / facteur.maxScore) * 100;
                        const colorClass = 
                          facteur.impact === 'positif' ? 'bg-emerald-500' :
                          facteur.impact === 'negatif' ? 'bg-amber-500' :
                          facteur.impact === 'bloquant' ? 'bg-rose-500' :
                          'bg-blue-500';
                        return (
                          <div key={idx}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-base font-medium text-[var(--text-secondary)]">{facteur.nom}</span>
                              <span className="text-base font-semibold text-white">{facteur.score}/{facteur.maxScore}</span>
                            </div>
                            <div className="h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div className={`h-full ${colorClass} transition-all duration-300 rounded-full`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Conseils et blocages */}
                    {faisabiliteResult.conseils.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                        <div className="text-base font-semibold text-blue-400 mb-4">💡 Conseils</div>
                        <ul className="space-y-3">
                          {faisabiliteResult.conseils.map((conseil, idx) => (
                            <li key={idx} className="text-base text-blue-300">• {conseil}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {faisabiliteResult.blocages.length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
                        <div className="text-base font-semibold text-rose-400 mb-4">⚠️ Points d'attention</div>
                        <ul className="space-y-3">
                          {faisabiliteResult.blocages.map((blocage, idx) => (
                            <li key={idx} className="text-base text-rose-300">• {blocage}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Étape 2: Paramètres crédit */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                <section>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center text-indigo-400">
                      {Icons.calculator}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Paramètres du crédit</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Informations pré-remplies */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Récapitulatif de votre projet</h3>
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
                          <div className="text-xl font-bold text-cyan-400">{montantEmprunte.toLocaleString()} €</div>
                        </div>
                        <div>
                          <div className="text-sm text-[var(--text-muted)] mb-1">Durée</div>
                          <div className="text-xl font-bold text-white">{dureeCredit} ans</div>
                        </div>
                      </div>
                    </div>

                    {/* Taux d'intérêt */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Taux d'intérêt annuel</label>
                        <span className="text-4xl font-bold text-white">{tauxInteret.toFixed(2)}%</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[tauxInteret * 100]} onValueChange={(v) => setTauxInteret(v[0] / 100)} min={10} max={800} step={5} />
                      </div>
                      <div className="flex justify-between text-sm text-[var(--text-muted)] mt-3">
                        <span>0,1%</span>
                        <span>8%</span>
                      </div>
                    </div>

                    {/* Inclure charges */}
                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white mb-1">Inclure 20% de charges locatives</div>
                          <div className="text-sm text-[var(--text-muted)]">Taxe foncière, charges, vacance, gestion...</div>
                        </div>
                        <button
                          onClick={() => setInclureCharges(!inclureCharges)}
                          className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                            inclureCharges
                              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                              : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                          }`}
                        >
                          {inclureCharges ? 'Oui' : 'Non'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Résultats Rendement */}
                <section className="mt-12">
                  <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-3xl border border-indigo-500/20" style={{ padding: '56px' }}>
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center text-indigo-400">
                        {Icons.calculator}
                      </div>
                      <h2 className="text-3xl font-semibold text-white">Aperçu du rendement requis</h2>
                    </div>

                    {/* Rendement */}
                    <div className="text-center mb-12">
                      <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                        {rendementResult.statusEmoji} Rendement Brut Minimal Requis
                      </div>
                      <div className={`text-8xl font-extrabold bg-gradient-to-r ${
                        rendementResult.status === 'excellent' ? 'from-emerald-500 to-green-400' :
                        rendementResult.status === 'bon' ? 'from-blue-500 to-cyan-400' :
                        rendementResult.status === 'moyen' ? 'from-amber-500 to-yellow-400' :
                        'from-rose-500 to-red-400'
                      } bg-clip-text text-transparent mb-4`}>
                        {rendementResult.rendementRequis.toFixed(2)}%
                      </div>
                      <div className={`inline-flex items-center px-8 py-4 rounded-full text-xl font-semibold ${
                        rendementResult.status === 'excellent' ? 'bg-emerald-500/15 text-emerald-400' :
                        rendementResult.status === 'bon' ? 'bg-blue-500/15 text-blue-400' :
                        rendementResult.status === 'moyen' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-rose-500/15 text-rose-400'
                      }`}>
                        {rendementResult.statusLabel}
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Mensualité crédit</div>
                        <div className="text-3xl font-bold text-white">{rendementResult.mensualite.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                        <div className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">Loyer mensuel requis</div>
                        <div className={`text-3xl font-bold ${
                          rendementResult.status === 'excellent' ? 'text-emerald-400' :
                          rendementResult.status === 'bon' ? 'text-blue-400' :
                          rendementResult.status === 'moyen' ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>
                          {rendementResult.loyerMensuelRequis.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/mois
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className={`rounded-2xl border-l-4 p-6 ${
                      rendementResult.status === 'excellent' ? 'bg-emerald-500/10 border-emerald-500' :
                      rendementResult.status === 'bon' ? 'bg-blue-500/10 border-blue-500' :
                      rendementResult.status === 'moyen' ? 'bg-amber-500/10 border-amber-500' :
                      'bg-rose-500/10 border-rose-500'
                    }`}>
                      <p className={`text-base ${
                        rendementResult.status === 'excellent' ? 'text-emerald-300' :
                        rendementResult.status === 'bon' ? 'text-blue-300' :
                        rendementResult.status === 'moyen' ? 'text-amber-300' :
                        'text-rose-300'
                      }`}>
                        {rendementResult.message}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Étape 3: Localisation */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                <section>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-500/20 to-lime-600/10 flex items-center justify-center text-lime-400">
                      {Icons.map}
                    </div>
                    <h2 className="text-3xl font-semibold text-white">Localisation</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Ville domicile */}
                    <div>
                      <label className="text-lg font-semibold text-white mb-3 block">Ville domicile *</label>
                      <p className="text-sm text-[var(--text-muted)] mb-4">Votre lieu de résidence principal</p>
                      {villeDomicile ? (
                        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-red-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
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
                              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
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

                    {/* Villes relais */}
                    <div>
                      <label className="text-lg font-semibold text-white mb-3 block">Villes relais</label>
                      <p className="text-sm text-[var(--text-muted)] mb-4">Lieux de travail, famille, ou villes où vous pourriez investir (optionnel)</p>
                      <VilleSearch
                        placeholder="Ajouter une ville relais..."
                        onSelect={handleSelectRelais}
                      />
                      {villesRelais.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {villesRelais.map((ville, index) => (
                            <div key={index} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-blue-500/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
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
                                  className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                                >
                                  {Icons.x}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rayon */}
                    <div>
                      <div className="flex justify-between items-baseline mb-6">
                        <label className="text-xl font-medium text-[var(--text-secondary)]">Rayon de recherche</label>
                        <span className="text-4xl font-bold text-white">{rayon} km</span>
                      </div>
                      <div style={{ padding: '0 12px' }}>
                        <Slider value={[rayon]} onValueChange={(v) => setRayon(v[0])} min={5} max={50} step={5} />
                      </div>
                    </div>

                    {/* Carte */}
                    {(villeDomicile || villesRelais.length > 0) && (
                      <div className="mt-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400">
                            {Icons.map}
                          </div>
                          <h3 className="text-xl font-semibold text-white">Vue d'ensemble de vos villes</h3>
                        </div>
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
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
