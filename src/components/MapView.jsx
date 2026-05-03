/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getIcon = (type, isHovered = false) => {
  let color = '#3b82f6'; // Blue
  if (type === 'start') color = '#10b981'; // Emerald
  if (type === 'pickup') color = '#f59e0b'; // Amber
  if (type === 'dropoff') color = '#ef4444'; // Rose
  if (type === 'rest') color = '#8b5cf6'; // Violet
  if (type === 'fuel') color = '#f97316'; // Orange
  if (type === 'break') color = '#64748b'; // Slate

  const svgIcon = `
    <div class="relative flex items-center justify-center">
      ${type === 'start' ? '<div class="absolute inset-0 bg-emerald-500/40 rounded-full animate-ping scale-150"></div>' : ''}
      <div class="w-5 h-5 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative z-10 transition-transform ${isHovered ? 'scale-125' : ''}" style="background: ${color}">
        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    tooltipAnchor: [0, -10]
  });
};

function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      // Auto-fit bounds with 60px padding as requested
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.5 });
    }
  }, [bounds, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng, e.containerPoint);
    },
  });
  return null;
}

const MapView = ({ route, theme, onMapClick, draftMarkers = {} }) => {
  const [hoveredStop, setHoveredStop] = useState(null);

  const points = (route?.stops || []).filter(
    (stop) => Number.isFinite(stop?.lat) && Number.isFinite(stop?.lng)
  );
  const polyline = route?.polyline || [];
  
  const typeMap = {
    currentLocation: 'start',
    pickupLocation: 'pickup',
    dropoffLocation: 'dropoff'
  };

  const bounds = points.length > 0 
    ? points.map(p => [p.lat, p.lng]) 
    : polyline.length > 0 
      ? polyline 
      : null;

  const tileLayer = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer 
      center={[39.8283, -98.5795]} 
      zoom={4} 
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileLayer}
      />
      
      {polyline.length > 0 && (
        <>
          {/* Animated Route Line */}
          <Polyline 
            positions={polyline} 
            color={theme === 'dark' ? "#1e293b" : "#cbd5e1"} 
            weight={6} 
            opacity={0.8}
            lineCap="round"
          />
          <Polyline 
            positions={polyline} 
            pathOptions={{
              color: "#3b82f6",
              weight: 3,
              opacity: 0.9,
              dashArray: "8, 12",
              className: "animated-polyline" // Targeted in index.css
            }}
            lineCap="round"
          />
        </>
      )}
      
      {/* Actual Route Stops */}
      {points.map((stop, idx) => (
        <Marker 
          key={`stop-${idx}`} 
          position={[stop.lat, stop.lng]} 
          icon={getIcon(stop.type, hoveredStop === idx)}
          eventHandlers={{
            mouseover: () => setHoveredStop(idx),
            mouseout: () => setHoveredStop(null)
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false} className="custom-tooltip">
            <div className="p-3 min-w-[160px] bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">{stop.type}</p>
                 {stop.duration > 0 && <p className="text-[8px] font-bold opacity-40 italic">{stop.duration} HRS</p>}
              </div>
              <p className="font-bold text-[11px] leading-tight mb-2 truncate">{stop.location}</p>
              {stop.arrival_time && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Tactical ETA</p>
                  <p className="text-[10px] font-black text-emerald-400 tabular-nums">{stop.arrival_time}</p>
                </div>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {/* Draft Markers (Map Clicks) */}
      {Object.entries(draftMarkers).map(([field, pos]) => (
        <Marker 
          key={`draft-${field}`} 
          position={[pos.lat, pos.lng]} 
          icon={getIcon(typeMap[field])}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={true} className="custom-tooltip">
            <div className="px-3 py-1.5 bg-blue-600 text-white rounded-full shadow-lg">
              <p className="text-[8px] font-black uppercase tracking-widest">{pos.address || typeMap[field]}</p>
            </div>
          </Tooltip>
        </Marker>
      ))}
      
      <ChangeView bounds={bounds} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  );
};

export default MapView;
