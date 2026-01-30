import { Battery, BatteryCharging, BatteryWarning } from "lucide-react";

interface BatteryLevelProps {
    level: number;
}

export function BatteryLevel({ level }: BatteryLevelProps) {
    const isLow = level < 20;

    return (
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">Battery</h3>

            <div className="flex items-center justify-between">
                <div className="flex items-end gap-1">
                    <span className={`text-3xl font-bold ${isLow ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{level}</span>
                    <span className="text-xs text-gray-400 mb-1">%</span>
                </div>

                {isLow ? (
                    <BatteryWarning className="h-8 w-8 text-red-500 animate-pulse" />
                ) : level > 90 ? (
                    <div className="relative">
                        <Battery className="h-8 w-8 text-green-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="block h-3 w-4 bg-green-500"></span>
                        </div>
                    </div>
                ) : (
                    <Battery className="h-8 w-8 text-slate-400" />
                )}
            </div>

            <div className="mt-2 text-xs text-gray-400 text-right">
                {isLow ? "Replace/Charge Soon" : "Optimal Level"}
            </div>
        </div>
    );
}
