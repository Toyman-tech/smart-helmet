import { Activity } from "lucide-react";

interface ImpactForceProps {
    gForce: number; // e.g., 1.2g, 4.5g
}

export function ImpactForce({ gForce }: ImpactForceProps) {
    // Thresholds: Normal < 1.5g, Bump < 4g, Crash > 4g
    const isCrash = gForce > 4;
    const isBump = gForce > 1.5 && gForce <= 4;

    return (
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Impact (G)</h3>
                {isCrash && <Activity className="h-4 w-4 text-red-500 animate-pulse" />}
            </div>

            <div className="flex items-end gap-1 mb-2">
                <span className={`text-3xl font-bold ${isCrash ? 'text-red-600' : isBump ? 'text-yellow-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {gForce.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400 mb-1">G</span>
            </div>

            {/* Visual Bars */}
            <div className="flex gap-1 h-2">
                <div className={`flex-1 rounded-sm ${gForce > 0 ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                <div className={`flex-1 rounded-sm ${gForce > 1.5 ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                <div className={`flex-1 rounded-sm ${gForce > 3.0 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                <div className={`flex-1 rounded-sm ${gForce > 4.5 ? 'bg-red-600' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
            </div>
        </div>
    );
}
