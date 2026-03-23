"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import DispatcherLayout from "@/components/DispatcherLayout";
import { User, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

export default function RidersPage() {
    const [lastHeartbeat, setLastHeartbeat] = useState(0);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (!db) return;
        const statusRef = ref(db, "helmet/status");
        const unsub = onValue(statusRef, (snap) => {
            if (snap.exists()) {
                setLastHeartbeat(Date.now());
            }
        });

        const checkStatus = () => {
             setIsOnline(Date.now() - lastHeartbeat < 15000);
        };
        const interval = setInterval(checkStatus, 2000);
        return () => {
            unsub();
            clearInterval(interval);
        };
    }, [lastHeartbeat]);

    return (
        <DispatcherLayout>
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-wider mb-2 flex items-center gap-3">
                        <UsersIcon className="h-8 w-8 text-blue-500" /> Agency Directory
                    </h1>
                    <p className="text-slate-500">Monitor and manage all dispatched field agents and assets.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rider 1 */}
                    <div className={`bg-white dark:bg-slate-800 rounded-2xl border ${isOnline ? 'border-blue-200 dark:border-blue-900' : 'border-gray-200 dark:border-slate-700'} p-6 flex flex-col justify-between shadow-sm relative overflow-hidden`}>
                        {isOnline && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full"></div>}
                        <div className="flex gap-4 mb-6">
                            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">John Doe</h3>
                                <p className="text-sm text-gray-500 mb-2">Asset: Helmet #01</p>
                                <div className="flex items-center gap-2">
                                    {isOnline ? (
                                        <span className="flex items-center gap-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                            <Wifi className="h-3 w-3" /> ONLINE
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                            <WifiOff className="h-3 w-3" /> OFFLINE
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Link href="/dashboard" className="w-full text-center py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/80 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-800">
                            <ShieldAlert className="h-4 w-4" /> Open Telemetry Feed
                        </Link>
                    </div>

                    {/* Rider 2 */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm opacity-60">
                         <div className="flex gap-4 mb-6">
                            <div className="h-16 w-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Mike Smith</h3>
                                <p className="text-sm text-gray-500 mb-2">Asset: Helmet #02</p>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                        <WifiOff className="h-3 w-3" /> OFFLINE
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button disabled className="w-full py-3 bg-gray-50 dark:bg-slate-900 cursor-not-allowed rounded-xl text-sm font-bold text-gray-400 dark:text-slate-600 border border-slate-100 dark:border-slate-800">
                            Telemetry Unavailable
                        </button>
                    </div>
                </div>
            </div>
        </DispatcherLayout>
    );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
