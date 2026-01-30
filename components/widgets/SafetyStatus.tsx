import { ShieldCheck, ShieldAlert } from "lucide-react";

interface SafetyStatusProps {
    isWorn: boolean; // From IR Sensor
}

export function SafetyStatus({ isWorn }: SafetyStatusProps) {
    return (
        <div className={`p-4 rounded-xl border ${isWorn ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700' : 'bg-gray-100 dark:bg-slate-800/50 border-transparent opacity-75'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Helmet Status</h3>
                {isWorn ? (
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                ) : (
                    <ShieldAlert className="h-4 w-4 text-gray-400" />
                )}
            </div>

            <div className="mt-2">
                <div className={`text-xl font-bold ${isWorn ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                    {isWorn ? "SECURE" : "REMOVED"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {isWorn ? "IR Sensor Active" : "No Head Detected"}
                </div>
            </div>
        </div>
    );
}
