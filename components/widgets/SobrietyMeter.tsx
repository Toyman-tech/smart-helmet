interface SobrietyMeterProps {
    ppm: number;
}

export function SobrietyMeter({ ppm }: SobrietyMeterProps) {
    const isDanger = ppm > 300;
    const isWarning = ppm > 100 && ppm <= 300;

    // Calculate percentage for progress bar (cap at 500ppm usually)
    const percentage = Math.min((ppm / 500) * 100, 100);

    let colorClass = "bg-green-500";
    let textClass = "text-green-600 dark:text-green-400";
    if (isWarning) {
        colorClass = "bg-yellow-500";
        textClass = "text-yellow-600 dark:text-yellow-400";
    }
    if (isDanger) {
        colorClass = "bg-red-600";
        textClass = "text-red-600 dark:text-red-400";
    }

    return (
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">Sobriety (MQ-3)</h3>

            <div className="flex items-end gap-1 mb-2">
                <span className={`text-3xl font-bold ${textClass}`}>{ppm}</span>
                <span className="text-xs text-gray-400 mb-1">PPM</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-1">
                <div className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0</span>
                <span>250</span>
                <span>500+</span>
            </div>
        </div>
    );
}
