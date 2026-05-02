/* eslint-disable */
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getIcon = (type) => {
  let color = '#3b82f6'; // Blue
  if (type === 'start') color = '#10b981'; // Emerald
  if (type === 'pickup') color = '#f59e0b'; // Amber
  if (type === 'dropoff') color = '#ef4444'; // Rose
  if (type === 'rest') color = '#8b5cf6'; // Violet
  if (type === 'fuel') color = '#f97316'; // Orange
  if (type === 'break') color = '#64748b'; // Slate

  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : '';

  const svgIcon = `
    <div class="flex items-center gap-2 group">
      <div class="relative">
        ${type === 'start' ? '<div class="absolute inset-0 bg-emerald-500/40 rounded-full animate-ping scale-150"></div>' : ''}
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative z-10" style="background: ${color}">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white/50 backdrop-blur-sm -mt-0.5"></div>
      </div>
      <div class="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl transition-all group-hover:scale-110">
        <p class="text-[8px] font-black uppercase text-white tracking-[0.2em] whitespace-nowrap">${label}</p>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-div-icon',
    iconSize: [120, 40],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [100, 100], animate: true, duration: 2 });
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
  const points = route?.stops || [];
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
          <Polyline 
            positions={polyline} 
            color="#3b82f6" 
            weight={12} 
            opacity={0.1}
            lineCap="round"
          />
          <Polyline 
            positions={polyline} 
            color="#3b82f6" 
            weight={3} 
            opacity={0.8}
            dashArray="1, 10"
            lineCap="round"
          />
        </>
      )}
      
      {/* Actual Route Stops */}
      {points.map((stop, idx) => (
        <Marker 
          key={`stop-${idx}`} 
          position={[stop.lat || 0, stop.lng || 0]} 
          icon={getIcon(stop.type)}
        >
          <Popup className="custom-popup">
            <div className="p-4 min-w-[180px] bg-slate-900 text-white">
              <p className="text-tactical text-blue-400 mb-2">{stop.type}</p>
              <p className="font-bold text-sm leading-tight mb-3">{stop.location}</p>
              {stop.arrival_time && (
                <div className="pt-3 border-t border-white/10 space-y-1">
                  <p className="text-[8px] font-black opacity-40 tracking-[0.2em] uppercase">Tactical ETA</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">{stop.arrival_time}</p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Draft Markers (Map Clicks) */}
      {Object.entries(draftMarkers).map(([field, pos]) => (
        <Marker 
          key={`draft-${field}`} 
          position={[pos.lat, pos.lng]} 
          icon={getIcon(typeMap[field])}
        >
          <Popup className="custom-popup">
            <div className="p-3 text-center bg-slate-900 text-white">
              <p className="text-tactical opacity-40 mb-1">Target Vector</p>
              <p className="font-black text-[10px] text-blue-400">{typeMap[field].toUpperCase()}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      <ChangeView bounds={bounds} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  );
};

export default MapView;
