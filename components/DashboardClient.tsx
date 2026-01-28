"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { AlertTriangle, Battery, Wifi, WifiOff, Activity, Navigation } from "lucide-react";

// Dynamically import the map to disable SSR
const DashboardMap = dynamic(() => import("./DashboardMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
});

interface HelmetData {
    isEmergency: boolean;
    alcohol_ppm: number;
    isIntoxicated: boolean;
    location: { lat: number; lng: number };
    vitals: { battery: number; connection: "Online" | "Offline" };
}

const MOCK_DATA: HelmetData = {
    isEmergency: false,
    alcohol_ppm: 45,
    isIntoxicated: false,
    location: { lat: 6.45, lng: 3.38 },
    vitals: { battery: 85, connection: "Online" },
};

export default function DashboardClient() {
    const [data, setData] = useState<HelmetData>(MOCK_DATA);
    const [usingMock, setUsingMock] = useState(true);

    useEffect(() => {
        // Only try connecting to Firebase if db is available (client-side)
        if (!db) {
            console.log("Firebase not initialized (SSR), using mock data.");
            return;
        }

        const helmetRef = ref(db, "helmets/helmet_01");

        const unsubscribe = onValue(helmetRef, (snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.val());
                setUsingMock(false);
            } else {
                console.log("No data available, using mock.");
            }
        }, (error) => {
            console.error("Firebase read failed", error);
        });

        return () => unsubscribe();
    }, []);

    const simulateEmergency = () => {
        setData(prev => ({
            ...prev,
            isEmergency: !prev.isEmergency,
            alcohol_ppm: prev.isEmergency ? 45 : 450,
            isIntoxicated: !prev.isEmergency
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 md:gap-0">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Smart Helmet Dashboard</h1>
                        <p className="text-sm text-gray-500">Real-time Safety Monitoring System</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${usingMock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {usingMock ? 'DEMO MODE' : 'LIVE DATA'}
                        </span>
                        <button onClick={simulateEmergency} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition">
                            Toggle Simulation
                        </button>
                    </div>
                </header>

                {/* Emergency Banner */}
                {data.isEmergency && (
                    <div className="bg-red-600 text-white p-6 rounded-xl shadow-lg animate-pulse flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <AlertTriangle className="h-10 w-10" />
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-wider">Emergency Detected!</h2>
                                <p className="opacity-90">Fall detected or High Alcohol Level. Immediate action required.</p>
                            </div>
                        </div>
                        <div className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold">
                            ALERTING CONTACTS...
                        </div>
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Column 1: Rider Status & Vitals */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                                <Activity className="h-5 w-5 text-blue-500" /> System Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-500 font-medium flex items-center gap-2">
                                        <Battery className="h-4 w-4" /> Battery
                                    </span>
                                    <span className={`text-lg font-bold ${data.vitals.battery < 20 ? 'text-red-500' : 'text-green-600'}`}>
                                        {data.vitals.battery}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-500 font-medium flex items-center gap-2">
                                        {data.vitals.connection === 'Online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                                        Connection
                                    </span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${data.vitals.connection === 'Online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {data.vitals.connection}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Alcohol Monitor</h3>
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className={`text-5xl font-bold mb-2 ${data.alcohol_ppm > 300 ? 'text-red-600' : data.alcohol_ppm > 100 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {data.alcohol_ppm} <span className="text-lg text-gray-400 font-normal">ppm</span>
                                </div>
                                <div className={`text-sm px-3 py-1 rounded-full font-medium ${data.isIntoxicated ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {data.isIntoxicated ? 'INTOXICATED' : 'SOBER'}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-6">
                                    <div className={`h-2.5 rounded-full ${data.alcohol_ppm > 300 ? 'bg-red-600' : data.alcohol_ppm > 100 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${Math.min((data.alcohol_ppm / 500) * 100, 100)}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Threshold: 100 ppm warning, 300 ppm danger</p>
                            </div>
                        </div>
                    </div>

                    {/* Column 2 & 3: Map */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 h-[300px] md:h-[500px] flex flex-col">
                            <div className="p-4 pb-2 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                    <Navigation className="h-5 w-5 text-blue-500" /> Live Tracking
                                </h3>
                                <div className="text-xs text-gray-500 font-mono">
                                    LAT: {data.location.lat.toFixed(4)} | LNG: {data.location.lng.toFixed(4)}
                                </div>
                            </div>
                            <div className="flex-grow rounded-lg overflow-hidden m-2 border border-gray-100 relative z-0">
                                <DashboardMap location={data.location} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
