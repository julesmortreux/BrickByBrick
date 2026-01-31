'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';

interface ZoneBudgetAccessible {
  code_postal: string;
  commune?: string;
  pct_access: number;
  lat?: number;
  lon?: number;
  prix_median?: number;
  nb_ventes?: number;
}

interface MapComponentProps {
  zonesData: ZoneBudgetAccessible[];
  mapCenter: { lat: number; lon: number; zoom: number };
  budget: number;
  maxVentes: number;
  departement: string;
}

const getColorByAccess = (pct: number): string => {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#3b82f6';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
};

const getEmojiByAccess = (pct: number): string => {
  if (pct >= 75) return '🟢';
  if (pct >= 50) return '🔵';
  if (pct >= 25) return '🟡';
  return '🔴';
};

const getLabelByAccess = (pct: number): string => {
  if (pct >= 75) return 'Très accessible';
  if (pct >= 50) return 'Accessible';
  if (pct >= 25) return 'Moyennement accessible';
  return 'Peu accessible';
};

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

export default function MapComponent({ zonesData, mapCenter, budget, maxVentes, departement }: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(mapCenter.zoom);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  const getRadius = (nbVentes: number, zoom: number) => {
    // Base radius scales with zoom level - smaller when zoomed out
    const zoomFactor = Math.max(0.3, Math.min(1, (zoom - 4) / 4)); // Scale from 0.3x to 1x between zoom 4-8
    
    const baseRadius = departement ? 8 : 5;
    const maxRadius = departement ? 18 : 12;
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

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lon]}
      zoom={mapCenter.zoom}
      style={{ height: '500px', width: '100%', borderRadius: '16px', position: 'relative' }}
      key={`map-${zonesData.length}-${departement}-${mapCenter.zoom}`}
    >
      <ZoomTracker onZoomChange={handleZoomChange} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {zonesData.map((zone, index) => (
        <CircleMarker
          key={`${zone.code_postal}-${index}`}
          center={[zone.lat!, zone.lon!]}
          radius={getRadius(zone.nb_ventes || 1, currentZoom)}
          fillColor={getColorByAccess(zone.pct_access)}
          color={getColorByAccess(zone.pct_access)}
          fillOpacity={0.7}
          weight={0}
        >
        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
          <div style={{ fontWeight: 600 }}>
            {getEmojiByAccess(zone.pct_access)} {zone.commune || zone.code_postal}
          </div>
          <div style={{ color: getColorByAccess(zone.pct_access), fontWeight: 700 }}>
            {zone.pct_access.toFixed(1)}% ≤ {budget.toLocaleString()} €
          </div>
        </Tooltip>

        <Popup>
          <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.1rem' }}>
              {getEmojiByAccess(zone.pct_access)} {zone.commune || 'Commune inconnue'}
            </h4>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Code Postal:</strong></td>
                  <td style={{ textAlign: 'right', color: '#111827' }}>{zone.code_postal}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Accessibilité:</strong></td>
                  <td style={{ textAlign: 'right', color: getColorByAccess(zone.pct_access), fontWeight: 700 }}>
                    {zone.pct_access.toFixed(1)}%
                  </td>
                </tr>
                {zone.prix_median && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Prix médian:</strong></td>
                    <td style={{ textAlign: 'right', color: '#111827' }}>
                      {zone.prix_median.toLocaleString()} €
                    </td>
                  </tr>
                )}
                {zone.nb_ventes && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Nb ventes:</strong></td>
                    <td style={{ textAlign: 'right', color: '#111827' }}>{zone.nb_ventes}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: `${getColorByAccess(zone.pct_access)}15`,
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 600,
              color: getColorByAccess(zone.pct_access)
            }}>
              {getLabelByAccess(zone.pct_access)}
            </div>
          </div>
        </Popup>
      </CircleMarker>
    ))}
    </MapContainer>
  );
}
