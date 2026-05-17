import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2 } from 'lucide-react';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (address: string) => void;
  initialPosition?: [number, number];
  initialAddress?: string;
  placeholder?: string;
}

export default function MapPicker({ 
  onLocationSelect, 
  onAddressSelect, 
  initialPosition, 
  initialAddress = '',
  placeholder
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initialPos = initialPosition || [33.5731, -7.5898]; // Casablanca default

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView(initialPos, 13);

    // Add TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add initial marker if provided
    markerRef.current = L.marker(initialPos, { icon: DefaultIcon }).addTo(mapInstance.current);

    // Handle map click
    mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateLocation(lat, lng);
    });

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const lastSearchedQuery = useRef<string>('');

  // Debounced search logic
  useEffect(() => {
    const query = searchQuery.trim();
    const timer = setTimeout(() => {
      if (query.length >= 3 && query !== lastSearchedQuery.current) {
        performSearch(query);
        lastSearchedQuery.current = query;
      } else if (query.length < 3) {
        setResults([]);
        setShowResults(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateLocation = (lat: number, lng: number, zoom = 15) => {
    if (!mapInstance.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: DefaultIcon }).addTo(mapInstance.current);
    }

    mapInstance.current.setView([lat, lng], zoom);
    onLocationSelect(lat, lng);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setError('Service de recherche momentanément indisponible.');
    } finally {
      setIsSearching(false);
    }
  }

  const formatResultName = (feature: any) => {
    const p = feature.properties;
    const parts = [p.name, p.street, p.city, p.country].filter(Boolean);
    return parts.join(', ');
  };

  const selectResult = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    const address = formatResultName(feature);
    updateLocation(lat, lng, 16);
    setSearchQuery(address);
    lastSearchedQuery.current = address; // Prevent re-search
    setShowResults(false);
    if (onAddressSelect) onAddressSelect(address);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            autoFocus
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onAddressSelect) onAddressSelect(e.target.value);
            }}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
            placeholder={placeholder || "Rechercher une adresse..."}
            className={`w-full ps-10 pe-10 py-3 rounded-xl border ${error ? 'border-destructive' : 'border-border'} bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm`}
          />
          {isSearching && (
            <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          )}
        </div>

        {error && (
          <p className="mt-1 text-[10px] text-destructive px-2">{error}</p>
        )}

        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-background border border-border rounded-xl shadow-xl overflow-hidden max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {results.map((feature, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectResult(feature)}
                className="w-full text-left px-4 py-3 text-xs hover:bg-muted transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <span className="line-clamp-2">{formatResultName(feature)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div 
        ref={mapRef} 
        className="h-[250px] w-full rounded-xl overflow-hidden border border-border shadow-inner"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
