"use client";

import { useEffect } from "react";
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
    return (
        <div className="relative h-full w-full">
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
                        <div className="p-2">
                            <h3 className="font-bold flex items-center gap-2"><Navigation className="h-4 w-4 text-blue-500" /> Rider Location</h3>
                            <p className="text-xs text-gray-500">Last updated: Just now</p>
                            <div className="mt-2 text-xs font-mono bg-gray-100 p-1 rounded">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </div>
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
