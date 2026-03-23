import { Rotate3D } from "lucide-react";

interface RotationDataProps {
    dps: number; // Degrees per second
}

export function RotationData({ dps }: RotationDataProps) {
    // Thresholds: Normal < 100 DPS, Warning > 150 DPS, Critical >= 200 DPS (Firmware uses 200)
    const isCritical = dps >= 200;
    const isWarning = dps >= 150 && dps < 200;

    return (
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Rotation</h3>
                <Rotate3D className={`h-4 w-4 ${isCritical ? 'text-red-500 animate-spin' : isWarning ? 'text-yellow-500' : 'text-slate-400'}`} />
            </div>

            <div className="flex items-end gap-1 mb-4 mt-2">
                <span className={`text-4xl font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {dps.toFixed(0)}
                </span>
                <span className="text-sm text-gray-400 mb-1 font-mono">DPS</span>
            </div>

            {/* Visual Arc representation */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-auto overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-600' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min((dps / 300) * 100, 100)}%` }}
                ></div>
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>0</span>
                <span>150</span>
                <span>200+</span>
            </div>
        </div>
    );
}
