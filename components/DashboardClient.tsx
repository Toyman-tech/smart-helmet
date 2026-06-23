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
import { ExternalLink, RefreshCw, CheckCircle2, Volume2, VolumeX, Bell, BellOff, Play, Square, Settings } from "lucide-react";
import { SirenPlayer, requestNotificationPermission, sendDesktopNotification } from "@/lib/audio";

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

    // Alert Settings States
    const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [showSettingsPopover, setShowSettingsPopover] = useState(false);
    const [isTestSirenPlaying, setIsTestSirenPlaying] = useState(false);

    // Track last notified alert type to avoid duplicate notifications
    const lastAlertTypeRef = useRef<"CRASH" | "INTOXICATION" | null>(null);

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
                // Reset request_data to false once live data is received/synced
                if (db) {
                    set(ref(db, "helmet/commands/request_data"), false);
                }
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

    // Sync Notification Permission state on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    // Sync siren audio player with alert state
    useEffect(() => {
        if (activeAlertType && audioAlertsEnabled) {
            // Emergency alerts override and stop test siren automatically
            setIsTestSirenPlaying(false);
            SirenPlayer.start(activeAlertType);
        } else {
            // Only stop if the player is currently playing a real telemetry alarm
            if (!isTestSirenPlaying) {
                SirenPlayer.stop();
            }
        }
        return () => {
            SirenPlayer.stop();
        };
    }, [activeAlertType, audioAlertsEnabled, isTestSirenPlaying]);

    // Handle desktop notifications on emergency alerts
    useEffect(() => {
        if (activeAlertType && activeAlertType !== lastAlertTypeRef.current) {
            if (notificationsEnabled) {
                const title = activeAlertType === 'CRASH' 
                    ? '⚠️ HELMET CRASH DETECTED!' 
                    : '🍺 RIDER INTOXICATION ALERT!';
                
                const body = activeAlertType === 'CRASH'
                    ? `Critical emergency! Impact detected on rider's helmet. GPS: ${telemetry.lat.toFixed(6)}, ${telemetry.lng.toFixed(6)}`
                    : `Sobriety threshold breached. High alcohol level detected on safety helmet telemetry.`;

                sendDesktopNotification(title, {
                    body,
                    requireInteraction: true,
                    tag: 'helmet-emergency-alert'
                });
            }
        }
        lastAlertTypeRef.current = activeAlertType;
    }, [activeAlertType, notificationsEnabled, telemetry.lat, telemetry.lng]);

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
                        
                        {/* Alert settings dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                                className={`px-4 py-3 sm:py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition border w-full sm:w-auto ${
                                    showSettingsPopover
                                        ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                }`}
                            >
                                <Settings className="h-4 w-4" /> Settings
                                {(audioAlertsEnabled || (notificationsEnabled && notificationPermission === 'granted')) ? (
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                ) : (
                                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                )}
                            </button>

                            {showSettingsPopover && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-[1002] p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Alert Dispatch Settings</h3>
                                        <button 
                                            onClick={() => setShowSettingsPopover(false)}
                                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {/* Audio Siren Toggle */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                {audioAlertsEnabled ? <Volume2 className="h-3.5 w-3.5 text-blue-500" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
                                                Audio Siren
                                            </span>
                                            <span className="text-[10px] text-slate-400">Synthesizes emergency siren audio</span>
                                        </div>
                                        <button
                                            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                                                audioAlertsEnabled ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-800 justify-start"
                                            }`}
                                        >
                                            <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
                                        </button>
                                    </div>

                                    {/* Desktop Notification Control */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                {notificationsEnabled && notificationPermission === 'granted' ? (
                                                    <Bell className="h-3.5 w-3.5 text-blue-500" />
                                                ) : (
                                                    <BellOff className="h-3.5 w-3.5 text-slate-400" />
                                                )}
                                                Desktop Alerts
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {notificationPermission === 'granted' 
                                                    ? 'Notifications allowed' 
                                                    : notificationPermission === 'denied'
                                                        ? 'Blocked by browser permissions'
                                                        : 'Requires browser permission'}
                                            </span>
                                        </div>
                                        
                                        {notificationPermission === 'default' ? (
                                            <button
                                                onClick={async () => {
                                                    const perm = await requestNotificationPermission();
                                                    setNotificationPermission(perm);
                                                    setNotificationsEnabled(perm === 'granted');
                                                }}
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition shadow-sm"
                                            >
                                                Request
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (notificationPermission === 'granted') {
                                                        setNotificationsEnabled(!notificationsEnabled);
                                                    }
                                                }}
                                                disabled={notificationPermission === 'denied'}
                                                className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                                                    notificationsEnabled && notificationPermission === 'granted'
                                                        ? "bg-blue-600 justify-end"
                                                        : "bg-slate-300 dark:bg-slate-800 justify-start cursor-not-allowed opacity-50"
                                                }`}
                                            >
                                                <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Test Siren Button */}
                                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
                                        <button
                                            onClick={async () => {
                                                await SirenPlayer.resume();
                                                
                                                if (isTestSirenPlaying) {
                                                    SirenPlayer.stop();
                                                    setIsTestSirenPlaying(false);
                                                } else {
                                                    SirenPlayer.start('TEST');
                                                    setIsTestSirenPlaying(true);
                                                }
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                                isTestSirenPlaying
                                                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                        >
                                            {isTestSirenPlaying ? (
                                                <>
                                                    <Square className="h-3.5 w-3.5 fill-current" /> Stop Test Siren
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-3.5 w-3.5 fill-current" /> Test Alert Siren
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

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
                        <div className="flex-1 relative z-0">
                            <LiveMap location={{lat: telemetry.lat, lng: telemetry.lng}} breadcrumb={breadcrumb} alertType={activeAlertType} />
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
