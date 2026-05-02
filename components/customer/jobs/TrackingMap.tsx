'use client';

/**
 * components/customer/jobs/TrackingMap.tsx
 *
 * Leaflet map showing the assigned employee's GPS location.
 * Must be imported with dynamic(() => import(...), { ssr: false })
 * to prevent Next.js SSR errors (Leaflet requires window).
 */

import { useEffect, useRef, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { TrackingData } from '@/lib/customerTypes';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  tracking: TrackingData;
}

const TrackingMap = memo(function TrackingMap({ tracking }: TrackingMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !tracking.latitude || !tracking.longitude) return;

    // Dynamically import Leaflet (client-side only)
    import('leaflet').then((L) => {
      // Fix default marker icon paths (Leaflet + webpack issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) {
        // Initialize map
        mapRef.current = L.map(containerRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView([tracking.latitude!, tracking.longitude!], 15);

        // OpenStreetMap tiles (no API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Custom marker with employee name popup
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 120px;">
            <strong style="color: #4f46e5;">${tracking.employeeName || 'Employee'}</strong>
            ${tracking.location_updated_at
              ? `<br/><span style="font-size: 11px; color: #94a3b8;">Updated ${formatDistanceToNow(new Date(tracking.location_updated_at), { addSuffix: true })}</span>`
              : ''
            }
            ${tracking.is_online
              ? '<br/><span style="font-size: 11px; color: #4ade80;">● Online</span>'
              : '<br/><span style="font-size: 11px; color: #94a3b8;">● Offline</span>'
            }
          </div>
        `;

        markerRef.current = L.marker([tracking.latitude!, tracking.longitude!])
          .addTo(mapRef.current)
          .bindPopup(popupContent)
          .openPopup();
      } else {
        // Update existing marker position
        markerRef.current?.setLatLng([tracking.latitude!, tracking.longitude!]);
        mapRef.current.panTo([tracking.latitude!, tracking.longitude!]);
      }
    });

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.latitude, tracking.longitude]);

  if (!tracking.latitude || !tracking.longitude) {
    return (
      <div className="h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <p className="text-white/30 text-sm">Location not available yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-64 rounded-2xl overflow-hidden border border-white/10"
        style={{ zIndex: 0 }}
      />
      {tracking.location_updated_at && (
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs text-white/60">
          Updated {formatDistanceToNow(new Date(tracking.location_updated_at), { addSuffix: true })}
        </div>
      )}
    </div>
  );
});

export default TrackingMap;
