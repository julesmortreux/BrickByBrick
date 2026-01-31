'use client';

import { MapContainer, TileLayer, CircleMarker, Marker, Circle, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Commune {
  code_postal: string;
  commune: string;
  lat: number;
  lon: number;
  pct_access: number;
  prix_median?: number;
  nb_ventes?: number;
  distance_min: number;
}

interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

interface MapComponentProximiteProps {
  villes: Ville[];
  communesData: Commune[];
  mapCenter: { lat: number; lon: number; zoom: number };
  rayon: number;
  budget: number;
  maxVentes: number;
}

// Component to track zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    zoomend: () => {
      if (map) {
        onZoomChange(map.getZoom());
      }
    },
  });

  useEffect(() => {
    if (map) {
      onZoomChange(map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// Fonctions de couleur (mêmes que zones-accessibles)
const getColorByAccess = (pct: number): string => {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#3b82f6';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
};

// Pas besoin d'emoji, on utilise juste les couleurs

const getLabelByAccess = (pct: number): string => {
  if (pct >= 75) return 'Très accessible';
  if (pct >= 50) return 'Accessible';
  if (pct >= 25) return 'Moyennement accessible';
  return 'Peu accessible';
};

// Icône SVG pour maison (ville domicile)
const homeIconSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Icône SVG pour pin (ville relais)
const pinIconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="10" r="3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Icône pour ville domicile (rouge)
const homeIcon = L.divIcon({
  className: 'custom-home-icon',
  html: `<div style="
    width: 32px;
    height: 32px;
    background-color: #ef4444;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <div style="
      transform: rotate(45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    ">${homeIconSVG}</div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Icône pour ville relais (bleue)
const relayIcon = L.divIcon({
  className: 'custom-relay-icon',
  html: `<div style="
    width: 28px;
    height: 28px;
    background-color: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    ${pinIconSVG}
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function MapComponentProximite({ 
  villes, 
  communesData, 
  mapCenter, 
  rayon, 
  budget,
  maxVentes 
}: MapComponentProximiteProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(mapCenter.zoom);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  const getCommuneRadius = (nbVentes: number, zoom: number) => {
    // Base radius scales with zoom level - smaller when zoomed out
    const zoomFactor = Math.max(0.3, Math.min(1, (zoom - 4) / 4));
    
    const baseRadius = 5;
    const maxRadius = 12;
    const ratio = Math.sqrt((nbVentes || 1) / maxVentes);
    const calculatedRadius = baseRadius + (maxRadius - baseRadius) * ratio;
    
    return calculatedRadius * zoomFactor;
  };

  if (!isClient) {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
        Chargement de la carte...
      </div>
    );
  }

  // Séparer ville domicile et villes relais
  const villeDomicile = villes[0] || null;
  const villesRelais = villes.slice(1);

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lon]}
      zoom={mapCenter.zoom}
      style={{ height: '500px', width: '100%', borderRadius: '16px', position: 'relative' }}
      key={`map-proximite-${villes.length}-${rayon}-${communesData.length}`}
    >
      <ZoomTracker onZoomChange={handleZoomChange} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Cercles du rayon autour de chaque ville */}
      {villes.map((ville, index) => {
        if (!ville.lat || !ville.lon) return null;
        return (
          <Circle
            key={`circle-${index}`}
            center={[ville.lat, ville.lon]}
            radius={rayon * 1000} // Convertir km en mètres
            pathOptions={{
              color: index === 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              fillColor: index === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        );
      })}

      {/* Marqueur ville domicile */}
      {villeDomicile && villeDomicile.lat && villeDomicile.lon && (
        <Marker
          position={[villeDomicile.lat, villeDomicile.lon]}
          icon={homeIcon}
        >
          <Popup>
            <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {villeDomicile.nom}
              </h4>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Ville domicile
              </p>
              {villeDomicile.code_postal && (
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                  {villeDomicile.code_postal}
                </p>
              )}
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {villeDomicile.nom}
            </div>
          </Tooltip>
        </Marker>
      )}

      {/* Marqueurs villes relais */}
      {villesRelais.map((ville, index) => {
        if (!ville.lat || !ville.lon) return null;
        return (
          <Marker
            key={`relay-${index}`}
            position={[ville.lat, ville.lon]}
            icon={relayIcon}
          >
            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {ville.nom}
                </h4>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                  Ville relais
                </p>
                {ville.code_postal && (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    {ville.code_postal}
                  </p>
                )}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {ville.nom}
              </div>
            </Tooltip>
          </Marker>
        );
      })}

      {/* Marqueurs des communes */}
      {communesData.map((commune, index) => (
        <CircleMarker
          key={`${commune.code_postal}-${index}`}
          center={[commune.lat, commune.lon]}
          radius={getCommuneRadius(commune.nb_ventes || 1, currentZoom)}
          fillColor={getColorByAccess(commune.pct_access)}
          color={getColorByAccess(commune.pct_access)}
          fillOpacity={0.7}
          weight={0}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            <div style={{ fontWeight: 600 }}>
              {commune.commune || commune.code_postal}
            </div>
            <div style={{ color: getColorByAccess(commune.pct_access), fontWeight: 700 }}>
              {commune.pct_access.toFixed(1)}% ≤ {budget.toLocaleString('fr-FR')} €
            </div>
          </Tooltip>

          <Popup>
            <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.1rem' }}>
                {commune.commune || 'Commune inconnue'}
              </h4>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Code Postal:</strong></td>
                    <td style={{ textAlign: 'right', color: '#111827' }}>{commune.code_postal}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Accessibilité:</strong></td>
                    <td style={{ textAlign: 'right', color: getColorByAccess(commune.pct_access), fontWeight: 700 }}>
                      {commune.pct_access.toFixed(1)}%
                    </td>
                  </tr>
                  {commune.prix_median && (
                    <tr>
                      <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Prix médian:</strong></td>
                      <td style={{ textAlign: 'right', color: '#111827' }}>
                        {commune.prix_median.toLocaleString('fr-FR')} €
                      </td>
                    </tr>
                  )}
                  {commune.nb_ventes && (
                    <tr>
                      <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Nb ventes:</strong></td>
                      <td style={{ textAlign: 'right', color: '#111827' }}>{commune.nb_ventes}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Distance:</strong></td>
                    <td style={{ textAlign: 'right', color: '#111827' }}>
                      {commune.distance_min.toFixed(1)} km
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: `${getColorByAccess(commune.pct_access)}15`,
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 600,
                color: getColorByAccess(commune.pct_access)
              }}>
                {getLabelByAccess(commune.pct_access)}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
