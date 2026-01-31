'use client';

import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DepartementTension {
  departement: string;
  nom_departement?: string;
  taux_vacance: number;
  tension: string;
  part_locataires?: number;
  logements_total?: number;
  lat?: number;
  lon?: number;
}

interface MapComponentTensionProps {
  tensionData: DepartementTension[];
  selectedDept: string;
  onDeptSelect: (dept: string) => void;
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

// Fonctions de couleur selon le taux de vacance
const getColorByVacance = (taux: number): string => {
  if (taux < 6) return '#10b981'; // Vert - Très tendu
  if (taux < 8) return '#f59e0b'; // Orange - Tendu
  return '#ef4444'; // Rouge - Détendu
};

const getTensionLabel = (taux: number): string => {
  if (taux < 6) return 'Très tendu';
  if (taux < 8) return 'Tendu';
  return 'Détendu';
};

export default function MapComponentTension({ 
  tensionData, 
  selectedDept,
  onDeptSelect 
}: MapComponentTensionProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  // Calculer le centre de la carte (France)
  const mapCenter = { lat: 46.5, lon: 2.5, zoom: 6 };

  // Calculer le rayon des cercles selon le zoom
  const getDeptRadius = (zoom: number) => {
    const zoomFactor = Math.max(0.4, Math.min(1.2, (zoom - 4) / 4));
    return 15 * zoomFactor;
  };

  if (!isClient) {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
        Chargement de la carte...
      </div>
    );
  }

  // Filtrer les départements avec coordonnées
  const deptsWithCoords = tensionData.filter(d => d.lat && d.lon);

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lon]}
      zoom={mapCenter.zoom}
      style={{ height: '500px', width: '100%', borderRadius: '16px', position: 'relative' }}
      key={`map-tension-${tensionData.length}-${selectedDept}`}
    >
      <ZoomTracker onZoomChange={handleZoomChange} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Marqueurs des départements */}
      {deptsWithCoords.map((dept) => {
        const isSelected = dept.departement === selectedDept;
        const color = getColorByVacance(dept.taux_vacance);
        const radius = getDeptRadius(currentZoom);
        
        return (
          <CircleMarker
            key={dept.departement}
            center={[dept.lat!, dept.lon!]}
            radius={isSelected ? radius * 1.3 : radius}
            fillColor={color}
            color={isSelected ? '#fff' : color}
            fillOpacity={0.7}
            weight={isSelected ? 3 : 2}
            eventHandlers={{
              click: () => {
                onDeptSelect(dept.departement);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontWeight: 600 }}>
                {dept.departement} - {dept.nom_departement || dept.departement}
              </div>
              <div style={{ color: color, fontWeight: 700 }}>
                {dept.taux_vacance.toFixed(2)}% de vacance
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                {getTensionLabel(dept.taux_vacance)}
              </div>
            </Tooltip>

            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {dept.departement} - {dept.nom_departement || dept.departement}
                </h4>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Taux de vacance:</strong></td>
                      <td style={{ textAlign: 'right', color: color, fontWeight: 700 }}>
                        {dept.taux_vacance.toFixed(2)}%
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Tension:</strong></td>
                      <td style={{ textAlign: 'right', color: '#111827', fontWeight: 600 }}>
                        {getTensionLabel(dept.taux_vacance)}
                      </td>
                    </tr>
                    {dept.part_locataires !== undefined && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Part locataires:</strong></td>
                        <td style={{ textAlign: 'right', color: '#111827' }}>
                          {dept.part_locataires.toFixed(1)}%
                        </td>
                      </tr>
                    )}
                    {dept.logements_total !== undefined && (
                      <tr>
                        <td style={{ color: '#6b7280', padding: '4px 0' }}><strong>Total logements:</strong></td>
                        <td style={{ textAlign: 'right', color: '#111827' }}>
                          {dept.logements_total.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: `${color}15`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: color
                }}>
                  {dept.taux_vacance < 6 
                    ? '✅ Excellent pour investissement'
                    : dept.taux_vacance < 8
                    ? '⚡ Bon potentiel'
                    : '⚠️ Vigilance requise'}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
