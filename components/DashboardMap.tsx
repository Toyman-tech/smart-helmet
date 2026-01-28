"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";


interface DashboardMapProps {
    location: { lat: number; lng: number };
}

// Component to recenter map when location changes
function RecenterMap({ location }: { location: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView([location.lat, location.lng]);
    }, [location, map]);
    return null;
}

export default function DashboardMap({ location }: DashboardMapProps) {
    return (
        <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            scrollWheelZoom={false}
            className="h-full w-full rounded-lg"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
                <Popup>
                    Rider Location <br /> {location.lat}, {location.lng}
                </Popup>
            </Marker>
            <RecenterMap location={location} />
        </MapContainer>
    );
}
