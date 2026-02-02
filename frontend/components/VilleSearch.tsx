'use client';

import { useState, useEffect, useRef } from 'react';

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
interface CommuneSearchResult {
  nom: string;
  code_postal: string | null;
  lat?: number;
  lon?: number;
}

interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

interface VilleSearchProps {
  placeholder: string;
  onSelect: (ville: Ville) => void;
  disabled?: boolean;
}

const Icons = {
  pin: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export function VilleSearch({ placeholder, onSelect, disabled }: VilleSearchProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CommuneSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche de communes
  useEffect(() => {
    const searchCommunes = async () => {
      if (debouncedInput.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/communes/search?q=${encodeURIComponent(debouncedInput)}`);

        if (response.ok) {
          const data = await response.json();
          setResults(data.communes || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Erreur recherche communes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchCommunes();
  }, [debouncedInput]);

  const handleSelect = (result: CommuneSearchResult) => {
    const ville: Ville = {
      nom: result.nom,
      code_postal: result.code_postal || '',
      lat: result.lat,
      lon: result.lon
    };
    onSelect(ville);
    setInput('');
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg disabled:opacity-50"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {results.map((result, index) => (
            <button
              key={`${result.nom}-${result.code_postal}-${index}`}
              onClick={() => handleSelect(result)}
              className="w-full px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-color)] last:border-b-0 flex items-center gap-3"
            >
              <span className="text-[var(--text-muted)]">{Icons.pin}</span>
              <div>
                <div className="text-white font-medium">{result.nom}</div>
                {result.code_postal && (
                  <div className="text-sm text-[var(--text-muted)]">{result.code_postal}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && debouncedInput.length >= 2 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 text-center text-[var(--text-muted)]">
          Aucune commune trouvée
        </div>
      )}
    </div>
  );
}
