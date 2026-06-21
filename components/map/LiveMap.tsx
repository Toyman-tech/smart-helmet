"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import L from "leaflet";
import { useTheme } from "next-themes";
import { Navigation, Layers, Compass } from "lucide-react";

interface LiveMapProps {
    location: { lat: number; lng: number };
    breadcrumb: Array<{ lat: number, lng: number }>;
    alertType?: "CRASH" | "INTOXICATION" | null;
}

function RecenterMap({ location }: { location: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView([location.lat, location.lng]);
    }, [location, map]);
    return null;
}

const TILE_LAYERS = {
    light: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
};

export default function LiveMap({ location, breadcrumb, alertType }: LiveMapProps) {
    const [address, setAddress] = useState<string>("Locating...");
    const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(true);
    const { resolvedTheme } = useTheme();
    const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("dark");
    const [showStyleMenu, setShowStyleMenu] = useState(false);

    // Sync default map style with theme
    useEffect(() => {
        if (resolvedTheme === "dark") {
            setMapStyle("dark");
        } else {
            setMapStyle("light");
        }
    }, [resolvedTheme]);

    useEffect(() => {
        let active = true;
        setIsLoadingAddress(true);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`,
                    {
                        headers: {
                            "Accept-Language": "en",
                            "User-Agent": "SmartHelmetDashboard/1.0"
                        }
                    }
                );
                if (!response.ok) throw new Error("Failed to fetch address");
                const data = await response.json();
                if (active) {
                    if (data && data.address) {
                        const addr = data.address;
                        const latVal = location.lat;
                        const lngVal = location.lng;
                        
                        // Check if coordinates fall within the University of Ilorin campus bounding box
                        const isOnUnilorinCampus = latVal >= 8.4600 && latVal <= 8.4950 && lngVal >= 4.6500 && lngVal <= 4.6900;
                        
                        if (isOnUnilorinCampus) {
                            const parts = [];
                            
                            // Try to get a valid amenity/POI name from the campus (ignoring incorrect/confusing shop names)
                            const poi = addr.amenity || addr.office || addr.shop || addr.building || addr.tourism || addr.historic;
                            const cleanPoi = poi && poi !== "Lawee Business Concept" ? poi : null;
                            
                            if (cleanPoi) {
                                parts.push(cleanPoi);
                            } else {
                                // If specifically near the Lagos Hostel area coordinates
                                if (Math.abs(latVal - 8.4799) < 0.005 && Math.abs(lngVal - 4.6714) < 0.005) {
                                    parts.push("Lagos Hostel Area");
                                } else {
                                    parts.push("University of Ilorin Campus");
                                }
                            }
                            
                            parts.push("University of Ilorin");
                            parts.push("Ilorin");
                            parts.push("Kwara State");
                            parts.push("Nigeria");
                            
                            setAddress(parts.join(", "));
                        } else {
                            // Default parsing logic for areas outside campus
                            const parts = [];
                            
                            // 1. Street / Road Name
                            const street = addr.road || addr.street || addr.pedestrian || addr.highway || addr.path;
                            const houseNumber = addr.house_number;
                            if (street) {
                                parts.push(houseNumber ? `${houseNumber} ${street}` : street);
                            } else {
                                const poi = addr.amenity || addr.shop || addr.office || addr.building || addr.tourism;
                                if (poi) {
                                    parts.push(poi);
                                }
                            }
                            
                            // 2. Suburb / Neighborhood / District
                            const neighborhood = addr.neighbourhood || addr.suburb || addr.village || addr.quarter;
                            if (neighborhood) {
                                parts.push(neighborhood);
                            }
                            
                            // 3. City / Town
                            const city = addr.city || addr.town || addr.municipality || addr.county;
                            if (city) {
                                parts.push(city);
                            }
                            
                            // 4. State
                            if (addr.state) {
                                parts.push(addr.state);
                            }
                            
                            // 5. Country
                            if (addr.country) {
                                parts.push(addr.country);
                            }
                            
                            const cleanAddress = parts.join(", ");
                            setAddress(cleanAddress || data.display_name || "Unknown Location");
                        }
                    } else if (data && data.display_name) {
                        setAddress(data.display_name);
                    } else {
                        setAddress("Unknown Location");
                    }
                }
            } catch (error) {
                console.error("Error geocoding location:", error);
                if (active) {
                    // Fallback to offline/mock geocoding details if needed
                    if (Math.abs(location.lat - 8.4799) < 0.05 && Math.abs(location.lng - 4.6714) < 0.05) {
                        setAddress("University Road, Ilorin, Kwara State, Nigeria");
                    } else {
                        setAddress(`${location.lat.toFixed(5)}° N, ${location.lng.toFixed(5)}° E`);
                    }
                }
            } finally {
                if (active) {
                    setIsLoadingAddress(false);
                }
            }
        }, 1200);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [location.lat, location.lng]);

    // Generate dynamic custom pulsing marker based on active emergency alerts
    const getMarkerIcon = (alert: "CRASH" | "INTOXICATION" | null | undefined) => {
        if (typeof window === "undefined" || !L.divIcon) return undefined;

        let pulseColor = "bg-blue-500";
        let glowColor = "shadow-[0_0_12px_rgba(59,130,246,0.8)]";
        let innerColor = "bg-blue-600";
        let animateClass = "animate-ping";

        if (alert === "CRASH") {
            pulseColor = "bg-red-500";
            glowColor = "shadow-[0_0_15px_rgba(239,68,68,1)]";
            innerColor = "bg-red-600";
            animateClass = "animate-ping [animation-duration:0.8s]";
        } else if (alert === "INTOXICATION") {
            pulseColor = "bg-amber-500";
            glowColor = "shadow-[0_0_12px_rgba(245,158,11,0.9)]";
            innerColor = "bg-amber-600";
            animateClass = "animate-ping [animation-duration:1.2s]";
        }

        return L.divIcon({
            className: 'custom-gps-marker',
            html: `
                <div class="relative flex items-center justify-center h-12 w-12">
                    <span class="absolute inline-flex h-12 w-12 rounded-full ${pulseColor}/35 ${animateClass}"></span>
                    <span class="absolute inline-flex h-7 w-7 rounded-full ${pulseColor}/50 animate-pulse"></span>
                    <div class="relative flex items-center justify-center h-5 w-5 ${innerColor} rounded-full border-2 border-white dark:border-slate-900 ${glowColor} transition-all duration-300">
                        <span class="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -12]
        });
    };

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Live GIS Tracking Overlay with Detailed Location Info */}
            <div className={`absolute top-4 left-14 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border shadow-xl max-w-[280px] sm:max-w-xs transition-all duration-300 ${
                alertType === 'CRASH' 
                    ? 'border-red-500/50 shadow-red-500/10' 
                    : alertType === 'INTOXICATION' 
                        ? 'border-amber-500/50 shadow-amber-500/10' 
                        : 'border-gray-200 dark:border-slate-800'
            }`}>
                <h3 className="text-[9px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                        alertType === 'CRASH' 
                            ? 'bg-red-500 animate-ping' 
                            : alertType === 'INTOXICATION' 
                                ? 'bg-amber-500 animate-ping' 
                                : 'bg-emerald-500 animate-pulse'
                    }`}></span>
                    <span className={
                        alertType === 'CRASH' 
                            ? 'text-red-500 font-extrabold' 
                            : alertType === 'INTOXICATION' 
                                ? 'text-amber-500 font-extrabold' 
                                : 'text-slate-500 dark:text-slate-400'
                    }>
                        {alertType === 'CRASH' ? 'ALERT: CRASH DETECTED' : alertType === 'INTOXICATION' ? 'ALERT: SOBRIETY BREACH' : 'LIVE GIS TRACKING'}
                    </span>
                </h3>
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal line-clamp-2" title={address}>
                        {isLoadingAddress ? (
                            <span className="text-slate-400 dark:text-slate-500 italic animate-pulse">Resolving location coords...</span>
                        ) : (
                            address
                        )}
                    </p>
                    <div className="flex gap-2 text-[9px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                        <span>Lat: {location.lat.toFixed(6)}</span>
                        <span>Lng: {location.lng.toFixed(6)}</span>
                    </div>
                </div>
            </div>

            <MapContainer
                center={[location.lat, location.lng]}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full bg-slate-100 dark:bg-slate-900"
            >
                <TileLayer
                    attribution={TILE_LAYERS[mapStyle].attribution}
                    url={TILE_LAYERS[mapStyle].url}
                    key={mapStyle} // Force re-render tile layer on change
                />

                {/* Dynamic Marker */}
                <Marker 
                    position={[location.lat, location.lng]} 
                    icon={getMarkerIcon(alertType)}
                >
                    <Popup closeButton={false}>
                        <div className="p-3.5 min-w-[220px] text-slate-800 dark:text-slate-100 font-sans">
                            <h3 className="font-bold flex items-center gap-2 text-xs border-b border-slate-200 dark:border-slate-700/80 pb-2 mb-2 uppercase tracking-wide">
                                <Compass className={`h-4 w-4 ${
                                    alertType === 'CRASH' 
                                        ? 'text-red-500 animate-spin' 
                                        : alertType === 'INTOXICATION' 
                                            ? 'text-amber-500 animate-bounce' 
                                            : 'text-blue-500 animate-pulse'
                                }`} /> 
                                {alertType === 'CRASH' ? 'Crash Site Context' : alertType === 'INTOXICATION' ? 'Intoxicated Rider' : ' Roving Field Asset'}
                            </h3>
                            <p className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300 leading-snug">
                                {isLoadingAddress ? (
                                    <span className="text-slate-400 italic">Locating address...</span>
                                ) : (
                                    address
                                )}
                            </p>
                            <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800/70 p-2 rounded flex flex-col gap-1 border border-slate-200 dark:border-slate-700/50">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">LAT</span>
                                    <span className="font-bold">{location.lat.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">LNG</span>
                                    <span className="font-bold">{location.lng.toFixed(6)}</span>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 text-right">Last updated: Just now</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Breadcrumb Path - Animated flow */}
                <Polyline
                    positions={breadcrumb.map(p => [p.lat, p.lng])}
                    pathOptions={{ 
                        className: 'animated-polyline', 
                        color: alertType === 'CRASH' ? '#ef4444' : alertType === 'INTOXICATION' ? '#f59e0b' : '#3b82f6', 
                        weight: 4, 
                        opacity: 0.85 
                    }}
                />

                <RecenterMap location={location} />
            </MapContainer>

            {/* Elegant Map Style Selector Panel */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
                {showStyleMenu && (
                    <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200">
                        <button
                            onClick={() => { setMapStyle("light"); setShowStyleMenu(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between gap-4 ${
                                mapStyle === "light"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                        >
                            <span>Voyager (Light)</span>
                            <span className="text-[10px]">🌐</span>
                        </button>
                        <button
                            onClick={() => { setMapStyle("dark"); setShowStyleMenu(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between gap-4 ${
                                mapStyle === "dark"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                        >
                            <span>Cyber (Dark)</span>
                            <span className="text-[10px]">🌌</span>
                        </button>
                        <button
                            onClick={() => { setMapStyle("satellite"); setShowStyleMenu(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between gap-4 ${
                                mapStyle === "satellite"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                        >
                            <span>Satellite View</span>
                            <span className="text-[10px]">🛰️</span>
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setShowStyleMenu(!showStyleMenu)}
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 text-slate-700 dark:text-slate-300 flex items-center justify-center"
                    title="Change Map Layers"
                >
                    <Layers className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
