import { AlertTriangle, CheckCircle, Flame } from "lucide-react";

interface SobrietyMeterProps {
    value: number; // Raw analog value (0 - 4095)
}

export function SobrietyMeter({ value }: SobrietyMeterProps) {
    const isSafe = value < 1500;
    const isWarning = value >= 1500 && value <= 2500;
    const isDanger = value > 2500;

    // Calculate percentage for progress bar (cap at 4095)
    const percentage = Math.min((value / 4095) * 100, 100);

    let colorClass = "bg-green-500";
    let textClass = "text-green-600 dark:text-green-400";
    let label = "SAFE";
    let Icon = CheckCircle;

    if (isWarning) {
        colorClass = "bg-yellow-500";
        textClass = "text-yellow-600 dark:text-yellow-400";
        label = "ELEVATED";
        Icon = AlertTriangle;
    }
    if (isDanger) {
        colorClass = "bg-red-600";
        textClass = "text-red-600 dark:text-red-400";
        label = "INTOXICATED";
        Icon = Flame;
    }

    return (
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">Sobriety (MQ-3)</h3>

            <div className="flex items-end justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className={`h-8 w-8 ${textClass}`} />
                    <span className={`text-2xl font-bold ${textClass}`}>{label}</span>
                </div>
                <span className="text-xs text-gray-400 mb-1 font-mono">{value} raw</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-1 mt-4">
                <div className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>0</span>
                <span>1500 (Warn)</span>
                <span>2500 (Danger)</span>
            </div>
        </div>
    );
}
