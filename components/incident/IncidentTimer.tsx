"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface IncidentTimerProps {
    startTime?: number; // timestamp
}

export function IncidentTimer({ startTime }: IncidentTimerProps) {
    const [elapsed, setElapsed] = useState("00:00:00");

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, now - startTime);

            const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, "0");
            const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, "0");
            const hours = Math.floor((diff / (1000 * 60 * 60))).toString().padStart(2, "0");

            setElapsed(`${hours}:${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center gap-4 shadow-inner">
            <div className="bg-red-900/50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-red-500" />
            </div>
            <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Incident Duration</div>
                <div className="text-2xl font-mono text-white font-bold tracking-widest">
                    {elapsed}
                </div>
            </div>
        </div>
    );
}
