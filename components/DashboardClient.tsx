"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { onValue, ref, set } from "firebase/database";
import { collection, addDoc } from "firebase/firestore";
import { db, firestore } from "@/lib/firebase";
import DispatcherLayout from "./DispatcherLayout";
import { SafetyStatus } from "./widgets/SafetyStatus";
import { SobrietyMeter } from "./widgets/SobrietyMeter";
import { RotationData } from "./widgets/RotationData";
import { ImpactForce } from "./widgets/ImpactForce";
import { AlertBanner } from "./incident/AlertBanner";
import { IncidentTimer } from "./incident/IncidentTimer";
import { ContactPanel } from "./incident/ContactPanel";
import { DispatcherNotes } from "./incident/DispatcherNotes";
import { ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";

// Dynamically import the map to disable SSR
const LiveMap = dynamic(() => import("./map/LiveMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">Loading Satellite GIS...</div>
});

const INITIAL_DATA = {
    g_force: 0.0,
    rotation: 0.0,
    alcohol: 0,
    lat: 8.4799,
    lng: 4.6714,
    timestamp: 'Waiting for device...'
};

export default function DashboardClient() {
    const [telemetry, setTelemetry] = useState(INITIAL_DATA);
    const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
    const [breadcrumb, setBreadcrumb] = useState<Array<{ lat: number, lng: number }>>([{ lat: 8.4799, lng: 4.6714 }]);
    
    // Alerts
    const [crashAlertTime, setCrashAlertTime] = useState<number | null>(null);
    const [intoxAlertTime, setIntoxAlertTime] = useState<number | null>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!db) return;

        // Listen to Status (Heartbeat)
        const statusRef = ref(db, "helmet/status");
        const unsubStatus = onValue(statusRef, (snap) => {
            if (snap.exists()) {
                setLastHeartbeat(Date.now());
                const val = snap.val();
                if (val.lat && val.lng) {
                    const parsedLat = parseFloat(val.lat);
                    const parsedLng = parseFloat(val.lng);
                    setBreadcrumb(b => {
                        // Avoid duplicate path spots
                        const last = b[b.length - 1];
                        if (last && last.lat === parsedLat && last.lng === parsedLng) return b;
                        return [...b, { lat: parsedLat, lng: parsedLng }];
                    });
                    setTelemetry(t => ({ ...t, lat: parsedLat, lng: parsedLng }));
                }
            }
        });

        // Listen to Live View (Telemetry)
        const liveViewRef = ref(db, "helmet/live_view");
        const unsubLive = onValue(liveViewRef, (snap) => {
            if (snap.exists()) {
                const val = snap.val();
                setTelemetry(prev => ({
                    ...prev,
                    g_force: val.g_force || prev.g_force,
                    rotation: val.rotation || prev.rotation,
                    alcohol: val.alcohol || prev.alcohol,
                    lat: parseFloat(val.lat) || prev.lat,
                    lng: parseFloat(val.lng) || prev.lng,
                    timestamp: val.timestamp || prev.timestamp
                }));
            }
        });

        // Listen to Crash Alert
        const crashRef = ref(db, "helmet/alerts/crash");
        const unsubCrash = onValue(crashRef, (snap) => {
            if (snap.exists()) {
                const val = snap.val();
                if (val.status === "EMERGENCY_ACTIVE") {
                    setCrashAlertTime(Date.now());
                }
            }
        });

        // Listen to Alcohol Alert
        const alcRef = ref(db, "helmet/alerts/alcohol");
        const unsubAlc = onValue(alcRef, (snap) => {
            if (snap.exists()) {
                setIntoxAlertTime(Date.now());
            }
        });

        return () => {
            unsubStatus();
            unsubLive();
            unsubCrash();
            unsubAlc();
        };
    }, []);

    const isEmergency = !!crashAlertTime;
    const isIntoxicated = !!intoxAlertTime;
    
    // Crash takes priority
    const activeAlertType = isEmergency ? "CRASH" : isIntoxicated ? "INTOXICATION" : null;

    useEffect(() => {
        if (activeAlertType) {
            if (!audioRef.current) {
                audioRef.current = new Audio('/siren.mp3'); 
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [activeAlertType]);

    const requestLiveData = () => {
        if (!db) return;
        set(ref(db, "helmet/commands/request_data"), true);
    };

    const resolveIncident = () => {
        // Just show modal first
        setShowResolveModal(true);
    };

    const confirmResolveIncident = async () => {
        setIsSaving(true);
        if (firestore && activeAlertType) {
            try {
                // 1. Save to History Collection
                await addDoc(collection(firestore, "incident_history"), {
                    type: activeAlertType,
                    timestamp: new Date().toISOString(),
                    resolvedAt: new Date().toISOString(),
                    telemetry_snapshot: telemetry,
                });
                console.log("Incident successfully archived.");
            } catch (error) {
                console.error("Failed to archive incident", error);
                // Optionally show a toast error here
            }
        }

        // 2. Clear real-time alerts
        setCrashAlertTime(null);
        setIntoxAlertTime(null);
        if (db) {
           set(ref(db, "helmet/alerts/crash"), null);
           set(ref(db, "helmet/alerts/alcohol"), null);
        }
        
        setShowResolveModal(false);
        setIsSaving(false);

        // 3. Show Success Toast
        setSuccessMsg("Incident successfully resolved and archived!");
        setTimeout(() => setSuccessMsg(""), 4000);
    };

    return (
        <DispatcherLayout>
            <div className="p-4 md:p-6 lg:h-full flex flex-col gap-6">

                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <h2 className="text-xl font-bold">Smart Helmet Telemetry</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={requestLiveData}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 flex-grow sm:flex-grow-0"
                        >
                            <RefreshCw className="h-4 w-4" /> Sync Sensor Data
                        </button>
                        {activeAlertType && (
                            <button
                                onClick={resolveIncident}
                                className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-3 sm:py-2 rounded-lg text-sm font-bold shadow-lg transition tracking-wide flex-grow sm:flex-grow-0"
                            >
                                RESOLVE ALERT
                            </button>
                        )}
                    </div>
                </div>

                {/* Emergency Banner */}
                <AlertBanner alertType={activeAlertType} />

                {/* Resolve Confirmation Modal Overlay */}
                {showResolveModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold mb-2">Confirm Resolution</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Are you sure you want to resolve this <strong>{activeAlertType}</strong> alert? This will clear the active emergency and archive the current telemetry data to incident history.
                            </p>
                            
                            <div className="flex gap-4 justify-end">
                                <button 
                                    onClick={() => setShowResolveModal(false)}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmResolveIncident}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : null}
                                    {isSaving ? "Archiving..." : "Yes, Resolve Incident"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Toast */}
                {successMsg && (
                    <div className="fixed bottom-6 right-6 z-[1001] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom flex-wrap">
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-bold">{successMsg}</span>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:min-h-0">

                    {/* LEFT: Map */}
                    <div className="h-[400px] lg:h-auto lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden relative shrink-0">
                        <div className="absolute top-4 left-4 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur p-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow">
                            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Live GIS Tracking</h3>
                        </div>
                        <div className="flex-1 relative z-0">
                            <LiveMap location={{lat: telemetry.lat, lng: telemetry.lng}} breadcrumb={breadcrumb} />
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center text-xs">
                            <div className="font-mono text-gray-500">Device Clock: {telemetry.timestamp.split('T').join(' ')}</div>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${telemetry.lat},${telemetry.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                Open in Google Maps <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>

                    {/* RIGHT: Telemetry & Actions */}
                    <div className="lg:col-span-4 flex flex-col gap-4 lg:overflow-y-auto lg:pr-1 pb-20 lg:pb-0">

                        {/* Incident Context */}
                        {isEmergency && (
                            <div className="animate-in slide-in-from-right fade-in duration-500">
                                <IncidentTimer startTime={crashAlertTime || Date.now()} />
                            </div>
                        )}

                        {/* Widgets Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SafetyStatus lastHeartbeatTime={lastHeartbeat} />
                            <RotationData dps={telemetry.rotation} />
                            <SobrietyMeter value={telemetry.alcohol} />
                            <ImpactForce gForce={telemetry.g_force} />
                        </div>

                        {/* Incident Actions */}
                        <div className="flex flex-col gap-4 mt-2">
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
