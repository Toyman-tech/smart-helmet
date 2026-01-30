"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import DispatcherLayout from "./DispatcherLayout";
import { SafetyStatus } from "./widgets/SafetyStatus";
import { SobrietyMeter } from "./widgets/SobrietyMeter";
import { BatteryLevel } from "./widgets/BatteryLevel";
import { ImpactForce } from "./widgets/ImpactForce";
import { AlertBanner } from "./incident/AlertBanner";
import { IncidentTimer } from "./incident/IncidentTimer";
import { ContactPanel } from "./incident/ContactPanel";
import { DispatcherNotes } from "./incident/DispatcherNotes";
import { ExternalLink } from "lucide-react";

// Dynamically import the map to disable SSR
const LiveMap = dynamic(() => import("./map/LiveMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">Loading Satellite GIS...</div>
});

interface HelmetData {
    isEmergency: boolean;
    alcohol_ppm: number;
    isIntoxicated: boolean;
    location: { lat: number; lng: number };
    vitals: { battery: number; connection: "Online" | "Offline" };
    // New Fields
    ir_status: "Worn" | "Removed";
    impact_g: number;
    last_emergency_timestamp?: number;
}

const MOCK_DATA: HelmetData = {
    isEmergency: false,
    alcohol_ppm: 45,
    isIntoxicated: false,
    location: { lat: 6.45, lng: 3.38 },
    vitals: { battery: 85, connection: "Online" },
    ir_status: "Worn",
    impact_g: 0.2
};

export default function DashboardClient() {
    const [data, setData] = useState<HelmetData>(MOCK_DATA);
    const [breadcrumb, setBreadcrumb] = useState<Array<{ lat: number, lng: number }>>([{ lat: 6.45, lng: 3.38 }]);
    const [usingMock, setUsingMock] = useState(true);

    // Sound Effect
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Only try connecting to Firebase if db is available (client-side)
        if (!db) {
            console.log("Firebase not initialized (SSR), using mock data.");
            return;
        }

        const helmetRef = ref(db, "helmets/helmet_01");

        // Initial Breadcrumb push
        setBreadcrumb(prev => [...prev, MOCK_DATA.location]);

        const unsubscribe = onValue(helmetRef, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                setData(prev => {
                    // Update breadcrumb if location changed
                    if (val.location.lat !== prev.location.lat || val.location.lng !== prev.location.lng) {
                        setBreadcrumb(b => [...b, val.location]);
                    }
                    return val;
                });
                setUsingMock(false);
            }
        }, (error) => {
            console.error("Firebase read failed", error);
        });

        return () => unsubscribe();
    }, []);

    // Sound Alert Logic
    useEffect(() => {
        if (data.isEmergency) {
            if (!audioRef.current) {
                audioRef.current = new Audio('/siren.mp3'); // We need to add a file or just warn
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [data.isEmergency]);

    const simulateEmergency = () => {
        const isNowEmergency = !data.isEmergency;
        const now = Date.now();

        setData(prev => ({
            ...prev,
            isEmergency: isNowEmergency,
            alcohol_ppm: isNowEmergency ? 450 : 45,
            impact_g: isNowEmergency ? 8.5 : 0.2, // Huge impact
            last_emergency_timestamp: isNowEmergency ? now : undefined
        }));

        // Random move for breadcrumb
        if (!isNowEmergency) {
            setBreadcrumb([{ lat: 6.45, lng: 3.38 }]); // Reset
        }
    };

    return (
        <DispatcherLayout>
            <div className="p-4 md:p-6 lg:h-full flex flex-col gap-6">

                {/* Top Bar for Simulation / Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${data.vitals.connection === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">SYSTEM: {data.vitals.connection.toUpperCase()}</span>
                        {usingMock && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">SIMULATION (MOCK)</span>}
                    </div>
                    <button
                        onClick={simulateEmergency}
                        className="w-full sm:w-auto bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 rounded text-sm font-bold text-slate-700 dark:text-slate-200 transition"
                    >
                        {data.isEmergency ? "RESOLVE INCIDENT" : "TRIGGER SIMULATION"}
                    </button>
                </div>

                {/* Emergency Banner */}
                {data.isEmergency && <AlertBanner />}

                {/* Main Content Area: Scrollable on Mobile, Fixed/Grid on Desktop */}
                <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:min-h-0">

                    {/* LEFT: Map (Fixed height on mobile, Flex on Desktop) */}
                    <div className="h-[400px] lg:h-auto lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden relative shrink-0">
                        <div className="absolute top-4 left-4 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur p-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow">
                            <h3 className="text-xs font-bold uppercase text-gray-500">Live GIS Tracking</h3>
                        </div>
                        <div className="flex-1 relative z-0">
                            <LiveMap location={data.location} breadcrumb={breadcrumb} />
                        </div>
                        {/* Map Footer data */}
                        <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center text-xs">
                            <div className="font-mono text-gray-500">Last Ping: 100ms ago</div>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${data.location.lat},${data.location.lng}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                                Open in Google Maps <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>

                    {/* RIGHT: Telemetry & Actions (Vertical Stack) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 lg:overflow-y-auto lg:pr-1 pb-20 lg:pb-0">

                        {/* Incident Context */}
                        {data.isEmergency && (
                            <div className="animate-in slide-in-from-right fade-in duration-500">
                                <IncidentTimer startTime={data.last_emergency_timestamp || Date.now()} />
                            </div>
                        )}

                        {/* Widgets Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                            <SafetyStatus isWorn={data.ir_status === 'Worn'} />
                            <BatteryLevel level={data.vitals.battery} />
                            <SobrietyMeter ppm={data.alcohol_ppm} />
                            <ImpactForce gForce={data.impact_g} />
                        </div>

                        {/* Incident Actions */}
                        <div className="flex flex-col gap-4">
                            <ContactPanel />
                            <div className="h-48 lg:h-auto lg:flex-1">
                                <DispatcherNotes />
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </DispatcherLayout>
    );
}
