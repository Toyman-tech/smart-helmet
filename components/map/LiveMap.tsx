"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { Navigation } from "lucide-react";

interface LiveMapProps {
    location: { lat: number; lng: number };
    breadcrumb: Array<{ lat: number, lng: number }>;
}

function RecenterMap({ location }: { location: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView([location.lat, location.lng]);
    }, [location, map]);
    return null;
}

export default function LiveMap({ location, breadcrumb }: LiveMapProps) {
    const [address, setAddress] = useState<string>("Locating...");
    const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(true);

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

    return (
        <div className="relative h-full w-full">
            {/* Live GIS Tracking Overlay with Detailed Location Info */}
            <div className="absolute top-4 left-14 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg max-w-[280px] sm:max-w-xs transition-all duration-300">
                <h3 className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live GIS Tracking
                </h3>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2" title={address}>
                        {isLoadingAddress ? (
                            <span className="text-slate-400 dark:text-slate-500 italic animate-pulse">Fetching address...</span>
                        ) : (
                            address
                        )}
                    </p>
                    <div className="flex gap-2 text-[9px] font-mono text-slate-500 dark:text-slate-400">
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Dynamic Marker */}
                <Marker position={[location.lat, location.lng]}>
                    <Popup>
                        <div className="p-3 min-w-[200px] text-slate-800 dark:text-slate-100">
                            <h3 className="font-bold flex items-center gap-2 text-sm border-b pb-1 mb-2">
                                <Navigation className="h-4 w-4 text-blue-500 animate-pulse" /> Rider Location
                            </h3>
                            <p className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                {isLoadingAddress ? (
                                    <span className="text-slate-400 italic">Locating address...</span>
                                ) : (
                                    address
                                )}
                            </p>
                            <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 p-1.5 rounded flex flex-col gap-0.5 border border-slate-200 dark:border-slate-700">
                                <span>Lat: {location.lat.toFixed(6)}</span>
                                <span>Lng: {location.lng.toFixed(6)}</span>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-2">Last updated: Just now</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Breadcrumb Path */}
                <Polyline
                    positions={breadcrumb.map(p => [p.lat, p.lng])}
                    pathOptions={{ color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                />

                <RecenterMap location={location} />
            </MapContainer>

            {/* Map Controls Overlay (Mock) */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition" title="Satellite View">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                </button>
            </div>

        </div>
    );
}

